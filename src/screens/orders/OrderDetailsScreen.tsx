import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, FileText, Truck } from 'lucide-react';
import type { Delivery } from '@/domain';
import {
  formatQuantity,
  formatQuantityValue,
  statusPresentation,
  summarizeFulfilment,
  usesOrganizationContext,
} from '@/rules';
import {
  DetailList,
  Divider,
  EmptyState,
  ErrorState,
  ListRow,
  LoadingState,
  MetricTile,
  SectionHeader,
  StatusBadge,
  Surface,
} from '@/design-system';
import { ROUTES, Screen } from '@/navigation';
import {
  deliveryRepository,
  enquiryRepository,
  mineralRepository,
  orderRepository,
  packageRepository,
  projectRepository,
  stockPointRepository,
  useAsync,
} from '@/data';
import { useCopy } from '@/content';

/**
 * ORDER DETAILS.
 *
 * Answers "how much of this has actually moved, and where is the rest?".
 *
 * The fulfilment figures are DERIVED from the deliveries, never stored on the
 * order — an order is the commercial envelope and the deliveries are the
 * physical truth. Any shortfall recorded at receiving is surfaced here rather
 * than left buried in one delivery's receipt.
 *
 * The enquiry reference is a link, not a label: Requirement → Enquiry → Order
 * → Delivery is the traceability chain, and it should be walkable in both
 * directions.
 */
export function OrderDetailsScreen() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const t = useCopy();

  const query = useAsync(async () => {
    if (!orderId) throw new Error('An order is required');

    const order = await orderRepository.getById(orderId);
    if (!order) throw new Error('Order not found');

    const [deliveries, minerals, stockPoint, enquiry, project, activePackage] = await Promise.all([
      deliveryRepository.list({ orderId }),
      mineralRepository.listAll(),
      stockPointRepository.getById(order.stockPointId),
      enquiryRepository.getById(order.enquiryId),
      order.projectId ? projectRepository.getById(order.projectId) : Promise.resolve(null),
      order.packageId ? packageRepository.getById(order.packageId) : Promise.resolve(null),
    ]);

    return { order, deliveries, minerals, stockPoint, enquiry, project, activePackage };
  }, [orderId]);

  const order = query.data?.order;
  const showScope = order ? usesOrganizationContext(order.placedByUserType) : false;
  const fulfilment = query.data ? summarizeFulfilment(query.data.order, query.data.deliveries) : null;
  const mineral = query.data?.minerals.find((candidate) => candidate.id === order?.mineralId);
  const enquiry = query.data?.enquiry ?? null;

  return (
    <Screen
      title={t.orders.title}
      {...(order ? { subtitle: order.orderNumber } : {})}
      onBack
    >
      {query.loading && <LoadingState variant="list" rows={4} />}
      {query.error && <ErrorState onRetry={query.reload} />}

      {query.data && order && fulfilment && (
        <div className="pb-8">
          {/* ---------- Headline: what and how much ---------- */}
          <Surface className="border-b border-line px-4 py-4">
            <p className="text-display text-ink tabular">
              {formatQuantity(order.orderedQuantity)}
            </p>
            <p className="mt-1 text-body text-ink-secondary">{mineral?.name}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge {...statusPresentation.receiving(order.receivingStatus)} />
              <StatusBadge {...statusPresentation.dispatch(order.dispatchStatus)} />
            </div>
          </Surface>

          {/* ---------- Fulfilment: derived from the deliveries ---------- */}
          <Surface className="border-b border-line px-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <MetricTile
                label={t.orders.dispatched}
                value={formatQuantityValue(fulfilment.dispatched)}
                unit={fulfilment.dispatched.unit}
              />
              <MetricTile
                label={t.orders.received}
                value={formatQuantityValue(fulfilment.received)}
                unit={fulfilment.received.unit}
                tone="success"
              />
              <MetricTile
                label={t.orders.pendingDispatch}
                value={formatQuantityValue(fulfilment.pendingDispatch)}
                unit={fulfilment.pendingDispatch.unit}
              />
            </div>

            {/* A recorded shortfall is a compliance signal, never a footnote. */}
            {fulfilment.totalDiscrepancy.value > 0 && (
              <p className="mt-4 flex items-start gap-2 rounded-md bg-danger-50 px-3 py-2 text-body-sm text-danger-700">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden />
                <span className="tabular">
                  {formatQuantity(fulfilment.totalDiscrepancy)} {t.orders.shortReceived}
                </span>
              </p>
            )}
          </Surface>

          {/* ---------- Traceability: walk back to the requirement ---------- */}
          <SectionHeader title={t.enquiry.requirement} />
          <Surface className="border-y border-line">
            <DetailList
              items={[
                { label: t.orders.orderNumber, value: order.orderNumber, numeric: true },
                ...(order.digiTpNumber
                  ? [{ label: 'DigiTP number', value: order.digiTpNumber, numeric: true }]
                  : []),
                { label: t.fields.stockPoint, value: query.data.stockPoint?.name ?? '—' },
                ...(showScope && query.data.project
                  ? [{ label: t.context.project, value: query.data.project.name }]
                  : []),
                ...(showScope && query.data.activePackage
                  ? [{ label: t.context.package, value: query.data.activePackage.name }]
                  : []),
                { label: t.orders.placedOn, value: formatDate(order.createdAt) },
              ]}
            />

            {enquiry && (
              <>
                <Divider />
                <ListRow
                  leading={<FileText size={17} />}
                  title={t.orders.fromEnquiry}
                  subtitle={enquiry.enquiryNumber}
                  onClick={() => navigate(ROUTES.enquiryDetails(enquiry.id))}
                />
              </>
            )}
          </Surface>

          {/* ---------- The physical movements ---------- */}
          <SectionHeader title={t.orders.deliveries} />

          {query.data.deliveries.length === 0 ? (
            <Surface className="border-y border-line">
              <EmptyState
                className="py-8"
                icon={<Truck size={22} />}
                title={t.orders.noDeliveries}
                description={t.orders.noDeliveriesBody}
              />
            </Surface>
          ) : (
            <Surface className="border-y border-line divide-y divide-line">
              {query.data.deliveries.map((delivery) => (
                <DeliveryRow
                  key={delivery.id}
                  delivery={delivery}
                  onOpen={() => navigate(ROUTES.deliveryTracking(delivery.id))}
                />
              ))}
            </Surface>
          )}
        </div>
      )}
    </Screen>
  );
}

function DeliveryRow({ delivery, onOpen }: { delivery: Delivery; onOpen: () => void }) {
  const status = statusPresentation.delivery(delivery.status);
  const receipt = delivery.receipt;

  return (
    <ListRow
      leading={<Truck size={17} />}
      leadingTone={receipt?.hasDiscrepancy ? 'danger' : 'primary'}
      title={delivery.vehicle.registrationNumber}
      subtitle={
        receipt
          ? `Dispatched ${formatQuantity(receipt.dispatchedQuantity)}, received ${formatQuantity(receipt.receivedQuantity)}`
          : formatQuantity(delivery.dispatchedQuantity)
      }
      detail={delivery.permit.etpNumber}
      meta={<StatusBadge label={status.label} tone={status.tone} size="sm" />}
      onClick={onOpen}
    />
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
