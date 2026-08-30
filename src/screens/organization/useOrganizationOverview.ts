import type {
  Delivery,
  ID,
  InventoryBalance,
  Mineral,
  Order,
  Package,
  Project,
  Quantity,
  TemporaryExcavationApplication,
} from '@/domain';
import {
  type AttentionItem,
  deriveAttentionItems,
  isApplicationActive,
  isDeliveryActive,
  primaryAvailable,
} from '@/rules';
import {
  deliveryRepository,
  inventoryRepository,
  mineralRepository,
  orderRepository,
  packageRepository,
  projectRepository,
  temporaryExcavationRepository,
  useAsync,
  type AsyncState,
} from '@/data';

/**
 * The Organization Home read model.
 *
 * The Home answers one question — "what is happening across my organization,
 * and what needs my attention?" — and answering it needs six sources. In
 * production this would be a single dashboard endpoint; the composition is
 * kept here so the future team can see exactly what that endpoint must return.
 *
 * The screen receives finished values. It contains no filtering, no summing
 * and no sorting, because those are product rules and product rules live in
 * @/rules.
 */
export interface OrganizationOverview {
  attention: AttentionItem[];

  /** Business Overview metrics. */
  activeProjectCount: number;
  activePackageCount: number;
  activeOrderCount: number;
  availableInventory: Quantity | null;

  /** Active Deliveries — still moving or waiting to be received. */
  activeDeliveries: Delivery[];

  /** Available quantity per mineral, largest first. Drives the snapshot. */
  availableByMineral: { mineralId: ID; name: string; available: Quantity }[];

  /** Temporary Excavation module summary. Organization-only. */
  activeApplicationCount: number;
  applicationsNeedingAttention: number;

  /** Lookups the screen needs to render a delivery row without extra calls. */
  mineralName: (mineralId: ID) => string;
  packageName: (packageId: ID | undefined) => string | undefined;
  projectName: (projectId: ID | undefined) => string | undefined;
}

export function useOrganizationOverview(organizationId: ID | undefined): AsyncState<OrganizationOverview> {
  return useAsync<OrganizationOverview>(async () => {
    if (!organizationId) throw new Error('An organization is required');

    const [projects, packages, orders, deliveries, balances, applications, minerals] =
      await Promise.all([
        projectRepository.listByOrganization(organizationId),
        packageRepository.listByOrganization(organizationId),
        orderRepository.list({ organizationId }),
        deliveryRepository.list({ organizationId }),
        inventoryRepository.list({ organizationId }),
        temporaryExcavationRepository.listByOrganization(organizationId),
        mineralRepository.listAll(),
      ]);

    return compose({ projects, packages, orders, deliveries, balances, applications, minerals });
  }, [organizationId]);
}

/** Pure composition — separated so it is trivially testable. */
function compose({
  projects,
  packages,
  orders,
  deliveries,
  balances,
  applications,
  minerals,
}: {
  projects: Project[];
  packages: Package[];
  orders: Order[];
  deliveries: Delivery[];
  balances: InventoryBalance[];
  applications: TemporaryExcavationApplication[];
  minerals: Mineral[];
}): OrganizationOverview {
  const mineralById = new Map(minerals.map((mineral) => [mineral.id, mineral]));
  const packageById = new Map(packages.map((pkg) => [pkg.id, pkg]));
  const projectById = new Map(projects.map((project) => [project.id, project]));

  const packageName = (packageId: ID | undefined) =>
    packageId ? packageById.get(packageId)?.name : undefined;

  const activeDeliveries = deliveries.filter(isDeliveryActive);

  // Group balances by mineral, then total each group's available quantity.
  const byMineral = new Map<ID, InventoryBalance[]>();
  for (const balance of balances) {
    byMineral.set(balance.mineralId, [...(byMineral.get(balance.mineralId) ?? []), balance]);
  }

  const availableByMineral = [...byMineral.entries()]
    .map(([mineralId, group]) => ({
      mineralId,
      name: mineralById.get(mineralId)?.name ?? 'Mineral',
      available: primaryAvailable(group),
    }))
    .filter((entry): entry is { mineralId: ID; name: string; available: Quantity } =>
      entry.available !== null && entry.available.value > 0,
    )
    .sort((a, b) => b.available.value - a.available.value);

  return {
    availableByMineral,
    attention: deriveAttentionItems({ deliveries, applications, packageName }),

    activeProjectCount: projects.filter((project) => project.status === 'ACTIVE').length,
    activePackageCount: packages.filter((pkg) => pkg.status === 'ACTIVE').length,
    /* An order is active until everything ordered has been received. */
    activeOrderCount: orders.filter((order) => order.receivingStatus !== 'RECEIVED').length,
    availableInventory: primaryAvailable(balances),

    activeDeliveries,

    activeApplicationCount: applications.filter(isApplicationActive).length,
    applicationsNeedingAttention: applications.filter(
      (application) => application.status === 'QUERY_RAISED',
    ).length,

    mineralName: (mineralId) => mineralById.get(mineralId)?.name ?? 'Mineral',
    packageName,
    projectName: (projectId) => (projectId ? projectById.get(projectId)?.name : undefined),
  };
}
