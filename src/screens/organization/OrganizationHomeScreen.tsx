import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ClipboardList,
  FileText,
  PackageCheck,
  Search,
  ShieldAlert,
  Shovel,
  Truck,
} from 'lucide-react';
import type { Delivery } from '@/domain';
import type { AttentionItem } from '@/rules';
import {
  canReceiveDelivery,
  formatQuantity,
  formatQuantityValue,
  statusPresentation,
} from '@/rules';
import {
  Button,
  Divider,
  EmptyState,
  ErrorState,
  ListGroup,
  ListRow,
  LoadingState,
  MetricTile,
  SectionHeader,
  StatusBadge,
  Surface,
} from '@/design-system';
import { ROUTES, Screen } from '@/navigation';
import { useCurrentOrganization, useCurrentUser } from '@/state';
import { useCopy } from '@/content';
import { useOrganizationOverview, type OrganizationOverview } from './useOrganizationOverview';

/**
 * ORGANIZATION HOME — a data-driven business and operational overview.
 *
 * Section order is fixed by the product context and is not a layout
 * preference:
 *
 *   1. Attention Required     what must I act on?
 *   2. Business Overview      how is the organization doing?
 *   3. Quick Actions          what do I do most often?
 *   4. Active Deliveries      what is moving right now?
 *   5. Inventory Snapshot     what do I have?
 *   6. Temporary Excavation   what compliance work is open?
 *
 * Action comes before information, and information before navigation. A user
 * opening this screen at a site gate needs the waiting vehicle first, not a
 * chart.
 */
export function OrganizationHomeScreen() {
  const user = useCurrentUser();
  const organization = useCurrentOrganization();
  const overview = useOrganizationOverview(organization?.id);
  const t = useCopy();

  return (
    <Screen
      title={organization?.name ?? t.app.name}
      {...(user ? { subtitle: user.fullName } : {})}
    >
      {overview.loading && <LoadingState variant="list" rows={5} />}

      {overview.error && <ErrorState onRetry={overview.reload} />}

      {overview.data && <OverviewSections overview={overview.data} />}
    </Screen>
  );
}

function OverviewSections({ overview }: { overview: OrganizationOverview }) {
  const navigate = useNavigate();
  const t = useCopy();

  return (
    <div className="pb-8">
      {/* ---------- 1. ATTENTION REQUIRED ---------- */}
      <SectionHeader
        title={t.organizationHome.attentionRequired}
        {...(overview.attention.length > 0
          ? { action: <StatusBadge label={String(overview.attention.length)} tone="warning" size="sm" /> }
          : {})}
      />

      {overview.attention.length === 0 ? (
        <Surface className="border-y border-line">
          <EmptyState
            className="py-8"
            icon={<PackageCheck size={22} />}
            title={t.organizationHome.attentionClear}
            description={t.organizationHome.attentionClearBody}
          />
        </Surface>
      ) : (
        <ListGroup className="border-y border-line">
          {overview.attention.map((item) => (
            <AttentionRow key={item.id} item={item} />
          ))}
        </ListGroup>
      )}

      {/* ---------- 2. BUSINESS OVERVIEW ---------- */}
      <SectionHeader title={t.organizationHome.businessOverview} />
      <Surface className="border-y border-line px-4 py-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          <MetricTile
            label={t.organizationHome.activeProjects}
            value={overview.activeProjectCount}
            onClick={() => navigate(ROUTES.projects)}
          />
          <MetricTile
            label={t.organizationHome.activePackages}
            value={overview.activePackageCount}
          />
          <MetricTile
            label={t.organizationHome.activeOrders}
            value={overview.activeOrderCount}
            onClick={() => navigate(ROUTES.orders)}
          />
          <MetricTile
            label={t.organizationHome.availableInventory}
            value={
              overview.availableInventory
                ? formatQuantityValue(overview.availableInventory)
                : '—'
            }
            {...(overview.availableInventory ? { unit: overview.availableInventory.unit } : {})}
          />
        </div>
      </Surface>

      {/* ---------- 3. QUICK ACTIONS ---------- */}
      <SectionHeader title={t.organizationHome.quickActions} />
      <Surface className="border-y border-line px-4 py-4">
        <div className="grid grid-cols-3 gap-2">
          <QuickAction
            icon={<Search size={18} />}
            label={t.organizationHome.findStockPoint}
            onClick={() => navigate(ROUTES.stockPoints)}
          />
          <QuickAction
            icon={<FileText size={18} />}
            label={t.organizationHome.createEnquiry}
            onClick={() => navigate(ROUTES.enquiries)}
          />
          <QuickAction
            icon={<PackageCheck size={18} />}
            label={t.organizationHome.receiveMineral}
            onClick={() => navigate(ROUTES.receive)}
          />
        </div>
      </Surface>

      {/* ---------- 4. ACTIVE DELIVERIES ---------- */}
      <SectionHeader
        title={t.organizationHome.activeDeliveries}
        {...(overview.activeDeliveries.length > 0
          ? {
              action: (
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.orders)}
                  className="text-label font-medium text-primary-700"
                >
                  {t.actions.viewAll}
                </button>
              ),
            }
          : {})}
      />

      {overview.activeDeliveries.length === 0 ? (
        <Surface className="border-y border-line">
          <EmptyState
            className="py-8"
            icon={<Truck size={22} />}
            title={t.organizationHome.noActiveDeliveries}
            description={t.organizationHome.noActiveDeliveriesBody}
          />
        </Surface>
      ) : (
        <Surface className="border-y border-line">
          {overview.activeDeliveries.map((delivery, index) => (
            <div key={delivery.id}>
              {index > 0 && <Divider />}
              <DeliveryRow delivery={delivery} overview={overview} />
            </div>
          ))}
        </Surface>
      )}

      {/* ---------- 5. INVENTORY SNAPSHOT ---------- */}
      {/*
        Business Overview already carries the headline total, so this section
        earns its place by breaking it down per mineral. Restating one number
        twice on one screen would be chrome, not information.
      */}
      <SectionHeader
        title={t.organizationHome.inventorySnapshot}
        action={
          <button
            type="button"
            onClick={() => navigate(ROUTES.inventory)}
            className="text-label font-medium text-primary-700"
          >
            {t.actions.viewAll}
          </button>
        }
      />
      <Surface className="border-y border-line px-4 py-4">
        <MetricTile
          size="lg"
          label={t.organizationHome.availableInventory}
          value={
            overview.availableInventory ? formatQuantityValue(overview.availableInventory) : '0'
          }
          unit={overview.availableInventory?.unit ?? 'MT'}
          hint={t.organizationHome.acrossActivePackages}
        />

        {overview.availableByMineral.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-line pt-3">
            {overview.availableByMineral.map((entry) => (
              <div key={entry.mineralId} className="flex items-baseline justify-between gap-4">
                <span className="truncate text-body-sm text-ink-secondary">{entry.name}</span>
                <span className="tabular shrink-0 text-body-sm font-medium text-ink">
                  {formatQuantity(entry.available)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Surface>

      {/* ---------- 6. TEMPORARY EXCAVATION (organization only) ---------- */}
      <SectionHeader title={t.organizationHome.temporaryExcavation} />
      <Surface className="border-y border-line px-4 py-4">
        <div className="flex items-start gap-6">
          <MetricTile
            className="flex-1"
            label={t.organizationHome.activeApplications}
            value={overview.activeApplicationCount}
          />
          <MetricTile
            className="flex-1"
            label={t.organizationHome.needingAttention}
            value={overview.applicationsNeedingAttention}
            tone={overview.applicationsNeedingAttention > 0 ? 'warning' : 'default'}
          />
        </div>
        <Button
          variant="secondary"
          fullWidth
          className="mt-4"
          leftIcon={<Shovel size={15} />}
          onClick={() => navigate(ROUTES.temporaryExcavation)}
        >
          {t.organizationHome.viewApplications}
        </Button>
      </Surface>
    </div>
  );
}

/** One actionable item. Tone and priority come from @/rules/attention. */
function AttentionRow({ item }: { item: AttentionItem }) {
  const navigate = useNavigate();

  const icon =
    item.kind === 'QUANTITY_DISCREPANCY' ? (
      <ShieldAlert size={17} />
    ) : item.kind === 'APPLICATION_QUERY_RAISED' ? (
      <ClipboardList size={17} />
    ) : (
      <AlertTriangle size={17} />
    );

  return (
    <ListRow
      leading={icon}
      leadingTone={item.tone === 'danger' ? 'danger' : 'warning'}
      title={item.title}
      subtitle={item.subject}
      {...(item.scope ? { detail: item.scope } : {})}
      onClick={() =>
        navigate(item.applicationId ? ROUTES.temporaryExcavation : ROUTES.orders)
      }
    />
  );
}

/**
 * A delivery in flight.
 *
 * Shows what the product context asks for — vehicle, mineral, quantity,
 * project, package, status — and offers Receive only when the delivery state
 * actually allows it. An action that is present but inert is worse than one
 * that is absent.
 */
function DeliveryRow({
  delivery,
  overview,
}: {
  delivery: Delivery;
  overview: OrganizationOverview;
}) {
  const navigate = useNavigate();
  const t = useCopy();
  const status = statusPresentation.delivery(delivery.status);
  const scope = [overview.projectName(delivery.projectId), overview.packageName(delivery.packageId)]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-600">
          <Truck size={17} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="tabular truncate text-title text-ink">
            {delivery.vehicle.registrationNumber}
          </p>
          <p className="mt-0.5 truncate text-body-sm text-ink-secondary">
            {overview.mineralName(delivery.permit.mineralId)} ·{' '}
            <span className="tabular">{formatQuantity(delivery.dispatchedQuantity)}</span>
          </p>
          {scope && <p className="mt-1 truncate text-caption text-ink-muted">{scope}</p>}
        </div>

        <StatusBadge label={status.label} tone={status.tone} size="sm" />
      </div>

      <div className="mt-3 flex gap-2 pl-12">
        <Button size="sm" variant="secondary" onClick={() => navigate(ROUTES.orders)}>
          {t.organizationHome.trackLive}
        </Button>
        {canReceiveDelivery(delivery) && (
          <Button size="sm" onClick={() => navigate(ROUTES.receive)}>
            {t.organizationHome.receive}
          </Button>
        )}
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pressable flex flex-col items-center gap-2 rounded-md border border-line bg-surface px-2 py-3 text-center hover:bg-neutral-50"
    >
      <span className="flex size-9 items-center justify-center rounded-md bg-primary-50 text-primary-600">
        {icon}
      </span>
      <span className="text-caption leading-tight text-ink-secondary">{label}</span>
    </button>
  );
}
