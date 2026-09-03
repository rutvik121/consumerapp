import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Circle, CheckCircle2, FileCheck, MapPinned, Phone, Truck } from 'lucide-react';
import { CircleMarker, MapContainer, Polyline, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Delivery } from '@/domain';
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
import { DigiTpPassModal } from './DigiTpPassModal';

/**
 * DELIVERY & TRANSIT DETAILS — an operational workflow for tracking & compliance.
 */
export function DeliveryTrackingScreen() {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const navigate = useNavigate();
  const t = useCopy();
  const [isDigiTpOpen, setIsDigiTpOpen] = useState(false);

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
      title="Delivery & Transit Details"
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
          {/* Modal for official DigiTP Pass View */}
          <DigiTpPassModal
            isOpen={isDigiTpOpen}
            onClose={() => setIsDigiTpOpen(false)}
            delivery={delivery}
          />

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

            <div className="mt-4 flex items-center justify-between gap-3">
              <StatusBadge {...statusPresentation.delivery(delivery.status)} />
              {lastUpdate && (
                <span className="text-caption text-ink-muted">
                  {t.tracking.lastUpdate} {relativeTime(lastUpdate.at)}
                </span>
              )}
            </div>

            {/* Quick Action to View DigiTP Pass */}
            <div className="mt-4">
              <Button
                variant="subtle"
                fullWidth
                leftIcon={<FileCheck size={16} />}
                onClick={() => setIsDigiTpOpen(true)}
                className="border border-[#c6daf6] bg-[#eef5fd] text-[#1241a6] hover:bg-[#dfeefe] font-semibold"
              >
                View DigiTP
              </Button>
            </div>

            {canReceive && (
              <p className="mt-3 rounded-md bg-warning-50 px-3 py-2 text-body-sm text-warning-700">
                {t.tracking.arrivedNote}
              </p>
            )}
          </Surface>

          {/* ---------- 2. The transport transaction behind it ---------- */}
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
            <div className="space-y-3 px-4 py-3">
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
              <Button
                variant="secondary"
                fullWidth
                leftIcon={<MapPinned size={15} />}
                onClick={() => navigate(ROUTES.liveVehicleTracking(delivery.id))}
              >
                Track Live Vehicle
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

export function LiveVehicleTrackingScreen() {
  const { deliveryId } = useParams<{ deliveryId: string }>();
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

  return (
    <Screen
      title="Live vehicle tracking"
      {...(delivery ? { subtitle: delivery.deliveryNumber } : {})}
      onBack
      className="relative bg-neutral-100"
    >
      {query.loading && <LoadingState variant="list" rows={5} />}
      {query.error && <ErrorState onRetry={query.reload} />}

      {query.data && delivery && (
        <div className="relative h-[calc(100vh-64px)] overflow-hidden bg-neutral-100">
          <div className="absolute inset-0 z-0">
            <DeliveryLiveMap delivery={delivery} showLabels={false} />
          </div>

          <div className="absolute inset-x-0 bottom-0 z-10 max-h-[58vh] rounded-t-[28px] border-t border-x border-line bg-surface shadow-e3">
            <div className="flex justify-center pt-2.5 pb-1">
              <span className="h-1.5 w-12 rounded-full bg-neutral-300" aria-hidden />
            </div>

            <div className="no-scrollbar overflow-y-auto px-4 pb-5 pt-2">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-title-sm text-ink">{delivery.vehicle.registrationNumber}</p>
                  <p className="text-body-sm text-ink-secondary">
                    {mineral?.name} · <span className="tabular">{formatQuantity(delivery.dispatchedQuantity)}</span>
                  </p>
                </div>
                <StatusBadge {...statusPresentation.delivery(delivery.status)} />
              </div>

              <DetailList
                items={[
                  { label: 'From', value: delivery.permit.sourceQuarryName },
                  { label: 'To', value: delivery.permit.destinationLabel },
                  { label: 'Driver', value: delivery.vehicle.driverName },
                  { label: 'Mobile', value: delivery.vehicle.driverMobileNumber },
                  { label: 'Permit no.', value: delivery.permit.etpNumber, numeric: true },
                  {
                    label: 'Last update',
                    value: formatDateTime(
                      delivery.tracking.at(-1)?.at ??
                        delivery.arrivedAt ??
                        delivery.expectedArrivalAt ??
                        delivery.dispatchedAt ??
                        new Date().toISOString(),
                    ),
                  },
                ]}
              />

              <div className="mt-4 flex gap-2">
                <Button
                  variant="secondary"
                  fullWidth
                  leftIcon={<Phone size={15} />}
                  onClick={() => {
                    window.location.href = `tel:${delivery.vehicle.driverMobileNumber}`;
                  }}
                >
                  {t.tracking.callDriver}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
}

function DeliveryLiveMap({
  delivery,
  showLabels = true,
}: {
  delivery: Delivery;
  showLabels?: boolean;
}) {
  const sourceUpdate = delivery.tracking.find((update) => update.geo);
  const latestUpdate = [...delivery.tracking].reverse().find((update) => update.geo);
  const sourceGeo = sourceUpdate?.geo ?? delivery.destination.geo;
  const latestGeo = latestUpdate?.geo ?? delivery.permit.destinationGeo;
  const routePoints: [number, number][] = [
    [sourceGeo.latitude, sourceGeo.longitude],
    ...delivery.tracking
      .filter((update) => update.geo)
      .map((update) => [update.geo!.latitude, update.geo!.longitude] as [number, number]),
    [delivery.permit.destinationGeo.latitude, delivery.permit.destinationGeo.longitude],
  ];

  const center: [number, number] = [
    (sourceGeo.latitude + delivery.permit.destinationGeo.latitude) / 2,
    (sourceGeo.longitude + delivery.permit.destinationGeo.longitude) / 2,
  ];

  return (
    <div className={showLabels ? 'space-y-3' : 'h-full'}>
      <div className={showLabels ? 'h-64 overflow-hidden rounded-xl border border-line bg-neutral-100' : 'h-full overflow-hidden bg-neutral-100'}>
        <MapContainer
          center={center}
          zoom={10}
          scrollWheelZoom={true}
          zoomControl={showLabels ? false : true}
          style={{ height: '100%', width: '100%' }}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polyline
            positions={routePoints}
            pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.8 }}
          />
          <CircleMarker
            center={[sourceGeo.latitude, sourceGeo.longitude]}
            radius={8}
            pathOptions={{ color: '#0f766e', fillColor: '#14b8a6', fillOpacity: 0.9 }}
          />
          <CircleMarker
            center={[latestGeo.latitude, latestGeo.longitude]}
            radius={9}
            pathOptions={{ color: '#1d4ed8', fillColor: '#60a5fa', fillOpacity: 0.95 }}
          />
          <CircleMarker
            center={[delivery.permit.destinationGeo.latitude, delivery.permit.destinationGeo.longitude]}
            radius={8}
            pathOptions={{ color: '#7c3aed', fillColor: '#a78bfa', fillOpacity: 0.9 }}
          />
        </MapContainer>
      </div>

      {showLabels && (
        <div className="flex flex-wrap gap-2 px-1 pb-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-caption font-medium text-emerald-700">
            <span className="size-2 rounded-full bg-emerald-500" />
            {sourceUpdate?.locationLabel ?? delivery.permit.sourceQuarryName}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-caption font-medium text-sky-700">
            <MapPinned size={12} />
            {latestUpdate?.locationLabel ?? 'Current location'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-caption font-medium text-violet-700">
            <span className="size-2 rounded-full bg-violet-500" />
            {delivery.permit.destinationLabel}
          </span>
        </div>
      )}
    </div>
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
