import { useNavigate, useParams } from 'react-router-dom';
import { Clock, Phone, Pickaxe } from 'lucide-react';
import { formatQuantity, statusPresentation } from '@/rules';
import {
  Button,
  DetailList,
  ErrorState,
  LoadingState,
  SectionHeader,
  StatusBadge,
  Surface,
} from '@/design-system';
import { OrganizationContextBar, ROUTES, Screen } from '@/navigation';
import { mineralRepository, stockPointRepository, useAsync } from '@/data';
import { useOperatingContext } from '@/state';
import { useCopy } from '@/content';
import { distanceInKm } from '@/rules';

/**
 * STOCK POINT DETAILS — enough to decide whether this source is suitable.
 *
 * ONE primary action: Send enquiry. Everything else on the screen exists to
 * support that single decision, which is why there is no "save", no "compare",
 * no rating and no price. This is a source of a state-tracked mineral, not a
 * product listing.
 *
 * Source quarry and licence number are shown because provenance is the point
 * of the whole ecosystem — the consumer can see where their mineral actually
 * originates before they ask for it.
 */
export function StockPointDetailsScreen() {
  const { stockPointId } = useParams<{ stockPointId: string }>();
  const context = useOperatingContext();
  const navigate = useNavigate();
  const t = useCopy();

  const query = useAsync(async () => {
    if (!stockPointId) throw new Error('A stock point is required');

    const [stockPoint, minerals] = await Promise.all([
      stockPointRepository.getById(stockPointId),
      mineralRepository.listAll(),
    ]);
    if (!stockPoint) throw new Error('Stock point not found');

    return { stockPoint, minerals };
  }, [stockPointId]);

  const stockPoint = query.data?.stockPoint;
  const minerals = query.data?.minerals ?? [];
  const destination = context?.destination ?? null;
  const distance =
    stockPoint && destination ? distanceInKm(destination.geo, stockPoint.geo) : null;

  return (
    <Screen
      title={stockPoint?.name ?? t.discovery.title}
      {...(stockPoint ? { subtitle: stockPoint.code } : {})}
      onBack
      context={<OrganizationContextBar showChange={false} />}
      footer={
        stockPoint && stockPoint.status !== 'CLOSED' ? (
          <Button
            size="lg"
            fullWidth
            onClick={() => navigate(ROUTES.createEnquiry(stockPoint.id))}
          >
            {t.discovery.sendEnquiry}
          </Button>
        ) : undefined
      }
    >
      {query.loading && <LoadingState variant="list" rows={4} />}
      {query.error && <ErrorState onRetry={query.reload} />}

      {query.data && stockPoint && (
        <div className="pb-6">
          <Surface className="border-b border-line px-4 py-4">
            <div className="flex items-center gap-2">
              <StatusBadge {...statusPresentation.stockPoint(stockPoint.status)} />
              {distance !== null && (
                <span className="tabular text-body-sm text-ink-secondary">
                  {distance} km {t.discovery.away}
                </span>
              )}
            </div>

            <p className="mt-3 text-body text-ink-secondary">
              {stockPoint.address.line1}, {stockPoint.address.taluka},{' '}
              {stockPoint.address.district} — {stockPoint.address.pincode}
            </p>

            <div className="mt-4 space-y-2">
              <p className="flex items-center gap-2 text-body-sm text-ink-secondary">
                <Clock size={14} className="shrink-0 text-ink-muted" aria-hidden />
                {stockPoint.operatingHours}
              </p>
              <p className="flex items-center gap-2 text-body-sm text-ink-secondary">
                <Phone size={14} className="shrink-0 text-ink-muted" aria-hidden />
                {stockPoint.contact.name} ·{' '}
                <span className="tabular">{stockPoint.contact.mobileNumber}</span>
              </p>
            </div>
          </Surface>

          <SectionHeader title={t.discovery.availableMinerals} />
          <Surface className="border-y border-line">
            <DetailList
              items={stockPoint.minerals.map((holding) => ({
                label:
                  minerals.find((mineral) => mineral.id === holding.mineralId)?.name ?? 'Mineral',
                value:
                  holding.availableQuantity.value > 0
                    ? formatQuantity(holding.availableQuantity)
                    : 'Out of stock',
                numeric: holding.availableQuantity.value > 0,
              }))}
            />
          </Surface>

          {/* Provenance — the upstream half of the traceability chain. */}
          <SectionHeader title={t.discovery.sourceQuarry} />
          <Surface className="border-y border-line px-4 py-3">
            <p className="flex items-start gap-2 text-body text-ink">
              <Pickaxe size={15} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden />
              {stockPoint.sourceQuarryName}
            </p>
            <p className="mt-1 pl-6 text-caption text-ink-muted tabular">
              {t.discovery.licence} {stockPoint.licenceNumber}
            </p>
          </Surface>
        </div>
      )}
    </Screen>
  );
}
