import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Circle, Phone, Truck } from 'lucide-react';
import { formatQuantity, relativeTime, statusPresentation } from '@/rules';
import {
  Button,
  DetailList,
  ErrorState,
  LoadingState,
  SectionHeader,
  StatusBadge,
  Surface,
} from '@/design-system';
import { ROUTES, Screen } from '@/navigation';
import { deliveryRepository, mineralRepository, useAsync } from '@/data';
import { useCopy } from '@/content';
import { DeliveryRouteStrip } from './DeliveryRouteStrip';

/**
 * VEHICLE TRACKING — an operational workflow, not a courier ETA screen.
 *
 * The product context lists the questions this screen exists to answer, and
 * they are answered in that order:
 *
 *   Which vehicle?              → the header, in the largest type on screen
 *   What mineral and quantity?  → immediately under it
 *   What is the current status? → status badge and how stale the update is
 *   Where is source and destination? → the route strip
 *   What transport transaction? → the e-TP block
 *   When was it last updated?   → the movement record
 *
 * NO map dominates this screen, and no progress bar animates on a timer. The
 * route strip is derived from actual reported position, and the movement
 * record below is the authoritative source — a map may support tracking but
 * must never be the only place the important information lives.
 *
 * PRODUCTION adds real map tiles beside the route strip. Nothing else changes.
 */
export function DeliveryTrackingScreen() {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const navigate = useNavigate();
  const t = useCopy();

  const query = useAsync(async () => {
    if (!deliveryId) throw new Error('A delivery is required');

    const delivery = await deliveryRepository.getById(deliveryId);
    if (!delivery) throw new Error('Delivery not found');

    const minerals = await mineralRepository.listAll();
    return { delivery, minerals };
  }, [deliveryId]);

  const delivery = query.data?.delivery;
  const mineral = query.data?.minerals.find(
    (candidate) => candidate.id === delivery?.permit.mineralId,
  );
  const lastUpdate = delivery?.tracking.at(-1);
  const canReceive = delivery?.status === 'ARRIVED_AT_DESTINATION';

  return (
    <Screen
      title={t.tracking.title}
      {...(delivery ? { subtitle: delivery.deliveryNumber } : {})}
      onBack
      footer={
        canReceive ? (
          <Button size="lg" fullWidth onClick={() => navigate(ROUTES.receive)}>
            {t.tracking.receiveNow}
          </Button>
        ) : undefined
      }
    >
      {query.loading && <LoadingState variant="list" rows={5} />}
      {query.error && <ErrorState onRetry={query.reload} />}

      {query.data && delivery && (
        <div className="pb-8">
          {/* ---------- 1. Which vehicle, carrying what ---------- */}
          <Surface className="border-b border-line px-4 py-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-600">
                <Truck size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="tabular text-title-lg text-ink">
                  {delivery.vehicle.registrationNumber}
                </p>
                <p className="mt-0.5 text-body text-ink-secondary">
                  {mineral?.name} ·{' '}
                  <span className="tabular">{formatQuantity(delivery.dispatchedQuantity)}</span>
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <StatusBadge {...statusPresentation.delivery(delivery.status)} />
              {lastUpdate && (
                <span className="text-caption text-ink-muted">
                  {t.tracking.lastUpdate} {relativeTime(lastUpdate.at)}
                </span>
              )}
            </div>

            {canReceive && (
              <p className="mt-3 rounded-md bg-warning-50 px-3 py-2 text-body-sm text-warning-700">
                {t.tracking.arrivedNote}
              </p>
            )}
          </Surface>

          {/* ---------- 2. Where it is going ---------- */}
          <SectionHeader title={t.tracking.route} />
          <Surface className="border-y border-line">
            <DeliveryRouteStrip delivery={delivery} />
          </Surface>

          {/* ---------- 3. The transport transaction behind it ---------- */}
          <SectionHeader title={t.tracking.transportPermit} />
          <Surface className="border-y border-line">
            <DetailList
              items={[
                { label: t.tracking.permitNumber, value: delivery.permit.etpNumber, numeric: true },
                { label: t.tracking.quarry, value: delivery.permit.sourceQuarryName },
                { label: t.tracking.destination, value: delivery.permit.destinationLabel },
                {
                  label: t.tracking.permittedQuantity,
                  value: formatQuantity(delivery.permit.permittedQuantity),
                  numeric: true,
                },
                { label: t.tracking.validUntil, value: formatDateTime(delivery.permit.validUntil) },
              ]}
            />
          </Surface>

          {/* ---------- 4. Who is driving ---------- */}
          <SectionHeader title={t.tracking.transporter} />
          <Surface className="border-y border-line">
            <DetailList
              items={[
                { label: t.tracking.transporter, value: delivery.vehicle.transporterName },
                { label: t.tracking.driver, value: delivery.vehicle.driverName },
              ]}
            />
            <div className="px-4 py-3">
              <Button
                variant="secondary"
                fullWidth
                leftIcon={<Phone size={15} />}
                onClick={() => {
                  window.location.href = `tel:${delivery.vehicle.driverMobileNumber}`;
                }}
              >
                {t.tracking.callDriver} · {delivery.vehicle.driverMobileNumber}
              </Button>
            </div>
          </Surface>

          {/* ---------- 5. The authoritative movement record ---------- */}
          <SectionHeader title={t.tracking.movement} />
          <Surface className="border-y border-line px-4 py-4">
            {delivery.tracking.length === 0 ? (
              <p className="py-4 text-center text-body-sm text-ink-muted">
                {t.tracking.noUpdatesBody}
              </p>
            ) : (
              <ol className="space-y-0">
                {[...delivery.tracking].reverse().map((update, index, all) => {
                  const isLatest = index === 0;
                  const isOldest = index === all.length - 1;

                  return (
                    <li key={`${update.at}-${index}`} className="flex gap-3">
                      {/* Timeline rail */}
                      <div className="flex shrink-0 flex-col items-center">
                        {isLatest ? (
                          <CheckCircle2 size={16} className="text-primary-600" aria-hidden />
                        ) : (
                          <Circle size={16} className="text-neutral-300" aria-hidden />
                        )}
                        {!isOldest && <span className="w-px flex-1 bg-line" />}
                      </div>

                      <div className={isOldest ? 'pb-0' : 'pb-5'}>
                        <p className="text-body-sm font-medium text-ink">
                          {statusPresentation.delivery(update.status).label}
                        </p>
                        <p className="mt-0.5 text-body-sm text-ink-secondary">
                          {update.locationLabel}
                        </p>
                        <p className="mt-0.5 text-caption text-ink-muted tabular">
                          {formatDateTime(update.at)}
                        </p>
                        {update.note && (
                          <p className="mt-1 text-caption text-ink-secondary">{update.note}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Surface>
        </div>
      )}
    </Screen>
  );
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
