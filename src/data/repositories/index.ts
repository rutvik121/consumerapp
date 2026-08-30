import type {
  ConsumptionEntry,
  Delivery,
  Enquiry,
  GeoPoint,
  ID,
  InventoryBalance,
  Mineral,
  Order,
  Organization,
  Package,
  Project,
  StockPoint,
  StockPointSearchResult,
  TemporaryExcavationApplication,
  User,
} from '@/domain';
import { distanceInKm } from '@/rules';
import { request } from '../client';
import { db } from '../db';

/**
 * REPOSITORIES — the ONLY way screens reach data.
 *
 * Contract:
 *   · Every method is async, mirroring a real network call.
 *   · Every method returns cloned data; callers cannot mutate the store.
 *   · Lookups that may legitimately miss return `null`, never throw.
 *   · Query shapes mirror what a real endpoint would expose, so replacing
 *     the body with `fetch()` requires no change at the call site.
 *
 * Mutation methods are added in the increment that first needs them
 * (Increment 3 creates enquiries; Increment 5 writes receipts and inventory).
 */

export const userRepository = {
  getById: (id: ID): Promise<User | null> =>
    request(() => db.users.find((user) => user.id === id) ?? null),
};

export const organizationRepository = {
  getById: (id: ID): Promise<Organization | null> =>
    request(() => db.organizations.find((org) => org.id === id) ?? null),
};

export const projectRepository = {
  listByOrganization: (organizationId: ID): Promise<Project[]> =>
    request(() => db.projects.filter((project) => project.organizationId === organizationId)),

  getById: (id: ID): Promise<Project | null> =>
    request(() => db.projects.find((project) => project.id === id) ?? null),
};

export const packageRepository = {
  listByProject: (projectId: ID): Promise<Package[]> =>
    request(() => db.packages.filter((pkg) => pkg.projectId === projectId)),

  listByOrganization: (organizationId: ID): Promise<Package[]> =>
    request(() => db.packages.filter((pkg) => pkg.organizationId === organizationId)),

  getById: (id: ID): Promise<Package | null> =>
    request(() => db.packages.find((pkg) => pkg.id === id) ?? null),
};

export const mineralRepository = {
  listAll: (): Promise<Mineral[]> => request(() => db.minerals),

  getById: (id: ID): Promise<Mineral | null> =>
    request(() => db.minerals.find((mineral) => mineral.id === id) ?? null),
};

export interface StockPointQuery {
  /** Free-text match on name, code, taluka or district. */
  search?: string;
  mineralId?: ID;
  /** When supplied, results are ranked by distance from this point. */
  near?: GeoPoint;
  maxDistanceKm?: number;
  /** Excludes stock points that are closed or hold no stock. */
  availableOnly?: boolean;
}

export const stockPointRepository = {
  /**
   * Discovery query. Distance is computed against the caller's operating
   * destination rather than stored on the entity, because "how far is it"
   * only has meaning relative to where the mineral is going.
   */
  search: (query: StockPointQuery = {}): Promise<StockPointSearchResult[]> =>
    request(() => {
      const term = query.search?.trim().toLowerCase();

      let results = db.stockPoints.filter((stockPoint) => {
        if (query.mineralId) {
          const holding = stockPoint.minerals.find((m) => m.mineralId === query.mineralId);
          if (!holding) return false;
          if (query.availableOnly && holding.availableQuantity.value <= 0) return false;
        }

        if (query.availableOnly && stockPoint.status === 'CLOSED') return false;

        if (term) {
          const haystack = [
            stockPoint.name,
            stockPoint.code,
            stockPoint.address.taluka,
            stockPoint.address.district,
          ]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(term)) return false;
        }

        return true;
      });

      const origin = query.near;
      let mapped: StockPointSearchResult[] = results.map((stockPoint) => ({
        stockPoint,
        distanceKm: origin ? distanceInKm(origin, stockPoint.geo) : 0,
      }));

      if (origin) {
        if (query.maxDistanceKm !== undefined) {
          const limit = query.maxDistanceKm;
          mapped = mapped.filter((result) => result.distanceKm <= limit);
        }
        mapped.sort((a, b) => a.distanceKm - b.distanceKm);
      }

      return mapped;
    }),

  getById: (id: ID): Promise<StockPoint | null> =>
    request(() => db.stockPoints.find((stockPoint) => stockPoint.id === id) ?? null),
};

export interface EnquiryQuery {
  raisedByUserId?: ID;
  organizationId?: ID;
  projectId?: ID;
  packageId?: ID;
}

export const enquiryRepository = {
  list: (query: EnquiryQuery = {}): Promise<Enquiry[]> =>
    request(() =>
      db.enquiries
        .filter((enquiry) => matches(enquiry, query))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    ),

  getById: (id: ID): Promise<Enquiry | null> =>
    request(() => db.enquiries.find((enquiry) => enquiry.id === id) ?? null),
};

export interface OrderQuery {
  placedByUserId?: ID;
  organizationId?: ID;
  projectId?: ID;
  packageId?: ID;
}

export const orderRepository = {
  list: (query: OrderQuery = {}): Promise<Order[]> =>
    request(() =>
      db.orders
        .filter((order) => matches({ ...order, raisedByUserId: order.placedByUserId }, query))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    ),

  getById: (id: ID): Promise<Order | null> =>
    request(() => db.orders.find((order) => order.id === id) ?? null),
};

export interface DeliveryQuery {
  orderId?: ID;
  organizationId?: ID;
  projectId?: ID;
  packageId?: ID;
  /** Only deliveries still moving or waiting to be received. */
  activeOnly?: boolean;
  /** Only deliveries that have arrived and are awaiting a receipt. */
  awaitingReceiptOnly?: boolean;
}

export const deliveryRepository = {
  list: (query: DeliveryQuery = {}): Promise<Delivery[]> =>
    request(() =>
      db.deliveries.filter((delivery) => {
        if (query.orderId && delivery.orderId !== query.orderId) return false;
        if (query.organizationId && delivery.organizationId !== query.organizationId) return false;
        if (query.projectId && delivery.projectId !== query.projectId) return false;
        if (query.packageId && delivery.packageId !== query.packageId) return false;

        if (query.awaitingReceiptOnly && delivery.status !== 'ARRIVED_AT_DESTINATION') return false;

        if (query.activeOnly) {
          const settled = delivery.status === 'RECEIVED' || delivery.status === 'RECEIVED_WITH_DISCREPANCY';
          if (settled) return false;
        }

        return true;
      }),
    ),

  /** Deliveries belonging to a consumer, resolved via their orders. */
  listForUser: (userId: ID): Promise<Delivery[]> =>
    request(() => {
      const orderIds = db.orders
        .filter((order) => order.placedByUserId === userId)
        .map((order) => order.id);
      return db.deliveries.filter((delivery) => orderIds.includes(delivery.orderId));
    }),

  getById: (id: ID): Promise<Delivery | null> =>
    request(() => db.deliveries.find((delivery) => delivery.id === id) ?? null),

  /** Receiving scans a QR and resolves the transport transaction behind it. */
  findByQrPayload: (payload: string): Promise<Delivery | null> =>
    request(() => db.deliveries.find((delivery) => delivery.permit.qrPayload === payload) ?? null),
};

export interface InventoryQuery {
  organizationId?: ID;
  projectId?: ID;
  packageId?: ID;
  userId?: ID;
}

export const inventoryRepository = {
  list: (query: InventoryQuery = {}): Promise<InventoryBalance[]> =>
    request(() =>
      db.inventoryBalances.filter((balance) => {
        if (balance.scope.kind === 'PACKAGE') {
          if (query.userId) return false;
          if (query.organizationId && balance.scope.organizationId !== query.organizationId) return false;
          if (query.projectId && balance.scope.projectId !== query.projectId) return false;
          if (query.packageId && balance.scope.packageId !== query.packageId) return false;
          return true;
        }

        if (query.organizationId || query.projectId || query.packageId) return false;
        if (query.userId && balance.scope.userId !== query.userId) return false;
        return true;
      }),
    ),

  getById: (id: ID): Promise<InventoryBalance | null> =>
    request(() => db.inventoryBalances.find((balance) => balance.id === id) ?? null),
};

export const consumptionRepository = {
  listByBalance: (inventoryBalanceId: ID): Promise<ConsumptionEntry[]> =>
    request(() =>
      db.consumptionEntries
        .filter((entry) => entry.inventoryBalanceId === inventoryBalanceId)
        .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)),
    ),
};

export const temporaryExcavationRepository = {
  /**
   * ORGANIZATION-ONLY. Callers must already hold the TEMPORARY_EXCAVATION
   * capability — access is enforced in navigation and route guards, not here.
   */
  listByOrganization: (organizationId: ID): Promise<TemporaryExcavationApplication[]> =>
    request(() =>
      db.temporaryExcavationApplications
        .filter((application) => application.organizationId === organizationId)
        .sort((a, b) => b.statusUpdatedAt.localeCompare(a.statusUpdatedAt)),
    ),

  getById: (id: ID): Promise<TemporaryExcavationApplication | null> =>
    request(
      () => db.temporaryExcavationApplications.find((application) => application.id === id) ?? null,
    ),
};

/** Shared scope filter for records that carry optional organization context. */
function matches(
  record: {
    raisedByUserId?: ID;
    organizationId?: ID;
    projectId?: ID;
    packageId?: ID;
  },
  query: EnquiryQuery,
): boolean {
  if (query.raisedByUserId && record.raisedByUserId !== query.raisedByUserId) return false;
  if (query.organizationId && record.organizationId !== query.organizationId) return false;
  if (query.projectId && record.projectId !== query.projectId) return false;
  if (query.packageId && record.packageId !== query.packageId) return false;
  return true;
}
