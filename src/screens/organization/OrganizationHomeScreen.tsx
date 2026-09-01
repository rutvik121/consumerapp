import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ChevronRight,
  ClipboardList,
  FileText,
  PackageCheck,
  QrCode,
  Search,
  ShieldAlert,
  Shovel,
  Truck,
} from 'lucide-react';
import type { Delivery } from '@/domain';
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
 *   2. Temporary Excavation   what compliance work is open?
 *   3. Business Overview      how is the organization doing?
 *   4. Quick Actions          what do I do most often?
 *   5. Active Deliveries      what is moving right now?
 *   6. Inventory Snapshot     what do I have?
 *
 * Temporary Excavation is a checkpoint for the organization, not a hidden
 * follow-on module. It must be visible without scrolling because it directly
 * answers whether the business has work outstanding with the department.
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
  const [attentionOpen, setAttentionOpen] = useState(false);

  return (
    <div className="pb-8">
      {/* ---------- 1. ATTENTION REQUIRED ---------- */}
      <SectionHeader
        title={t.organizationHome.attentionRequired}
        {...(overview.attention.length > 0
          ? {
              action: (
                <button
                  type="button"
                  onClick={() => setAttentionOpen((open) => !open)}
                  className="inline-flex items-center gap-2 text-left"
                >
                  <StatusBadge label={String(overview.attention.length)} tone="warning" size="sm" />
                  <ChevronRight
                    size={14}
                    className={['shrink-0 text-ink-muted transition-transform', attentionOpen ? 'rotate-90' : ''].join(' ')}
                  />
                </button>
              ),
            }
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
      ) : attentionOpen ? (
        <Surface className="border-y border-warning-200 bg-gradient-to-br from-warning-50 via-surface to-surface p-3 shadow-sm">
          <div className="space-y-2">
            {overview.attention.slice(0, 3).map((item) => {
              const itemIcon =
                item.kind === 'QUANTITY_DISCREPANCY' ? (
                  <ShieldAlert size={14} />
                ) : item.kind === 'APPLICATION_QUERY_RAISED' ? (
                  <ClipboardList size={14} />
                ) : (
                  <AlertTriangle size={14} />
                );

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.applicationId) navigate(ROUTES.temporaryExcavation);
                    else if (item.deliveryId) navigate(ROUTES.deliveryTracking(item.deliveryId));
                    else navigate(ROUTES.orders);
                  }}
                  className="flex w-full items-start gap-3 rounded-md border border-line bg-neutral-50 px-3 py-2.5 text-left transition-colors hover:bg-neutral-100"
                >
                  <span
                    className={[
                      'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md',
                      item.tone === 'danger' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600',
                    ].join(' ')}
                  >
                    {itemIcon}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-body-sm font-medium text-ink">{item.title}</p>
                      {item.scope && (
                        <span className="shrink-0 text-caption text-ink-muted">{item.scope}</span>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-caption leading-snug text-ink-secondary">
                      {item.subject}
                    </p>
                  </div>

                  <ChevronRight size={16} className="mt-1 shrink-0 text-ink-muted" />
                </button>
              );
            })}
            {overview.attention.length > 3 && (
              <button
                type="button"
                onClick={() => navigate(ROUTES.orders)}
                className="w-full pt-1 text-left text-label font-medium text-primary-700"
              >
                +{overview.attention.length - 3} more actions
              </button>
            )}
          </div>
        </Surface>
      ) : null}

      {/* ---------- 2. TEMPORARY EXCAVATION (organization only) ---------- */}
      <SectionHeader title={t.organizationHome.temporaryExcavation} />
      <Surface className="border-y border-primary-200 bg-gradient-to-br from-primary-50 via-surface to-surface shadow-md ring-1 ring-primary-100">
        <div className="px-4 py-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                <Shovel size={18} />
              </span>
              <div>
                <p className="text-label font-medium text-ink">Compliance queue</p>
                <p className="text-caption text-ink-muted">Needs action</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary-100 px-2.5 py-1 text-caption font-medium text-primary-700">
                Priority
              </span>
              <span className="rounded-full bg-primary-100 px-2.5 py-1 text-caption font-medium text-primary-700">
                {overview.activeApplicationCount} open
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-line bg-surface/90 p-3 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
              <MetricTile
                className="gap-2"
                label={t.organizationHome.activeApplications}
                value={overview.activeApplicationCount}
              />
            </div>
            <div className="rounded-xl border border-line bg-surface/90 p-3 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
              <MetricTile
                className="gap-2"
                label={t.organizationHome.needingAttention}
                value={overview.applicationsNeedingAttention}
                tone={overview.applicationsNeedingAttention > 0 ? 'warning' : 'default'}
              />
            </div>
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
        </div>
      </Surface>

      {/* ---------- 3. BUSINESS OVERVIEW ---------- */}
      <SectionHeader title={t.organizationHome.businessOverview} />
      <Surface className="border-y border-line bg-gradient-to-br from-surface to-neutral-50 shadow-sm">
        <div className="grid grid-cols-2 gap-3 px-4 py-4">
          <div className="rounded-xl border border-line bg-surface px-3 py-3">
            <MetricTile
              className="gap-2"
              label={t.organizationHome.activeProjects}
              value={overview.activeProjectCount}
              onClick={() => navigate(ROUTES.projects)}
            />
          </div>
          <div className="rounded-xl border border-line bg-surface px-3 py-3">
            <MetricTile
              className="gap-2"
              label={t.organizationHome.activePackages}
              value={overview.activePackageCount}
            />
          </div>
          <div className="rounded-xl border border-line bg-surface px-3 py-3">
            <MetricTile
              className="gap-2"
              label={t.organizationHome.activeOrders}
              value={overview.activeOrderCount}
              onClick={() => navigate(ROUTES.orders)}
            />
          </div>
          <div className="rounded-xl border border-line bg-surface px-3 py-3">
            <MetricTile
              className="gap-2"
              label={t.organizationHome.availableInventory}
              value={
                overview.availableInventory
                  ? formatQuantityValue(overview.availableInventory)
                  : '—'
              }
              {...(overview.availableInventory ? { unit: overview.availableInventory.unit } : {})}
            />
          </div>
        </div>
      </Surface>

      {/* ---------- 4. QUICK ACTIONS ---------- */}
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
            icon={<QrCode size={18} />}
            label={t.organizationHome.receiveMineral}
            onClick={() => navigate(ROUTES.receive)}
          />
        </div>
      </Surface>

      {/* ---------- 5. ACTIVE DELIVERIES ---------- */}
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

      {/* ---------- 6. INVENTORY SNAPSHOT ---------- */}
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

    </div>
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
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate(ROUTES.deliveryTracking(delivery.id))}
        >
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
