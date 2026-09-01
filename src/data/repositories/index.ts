import type {
  Address,
  ApplicantDetails,
  ApplicationDocumentKind,
  ExcavationMethod,
  ISODate,
  LandType,
  Quantity,
  UserType,
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
import {
  addQuantity,
  canRecordConsumption,
  computeApplicationFee,
  computeAvailableQuantity,
  distanceInKm,
} from '@/rules';
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

export * from './authRepository';
export * from './receivingRepository';
export * from './paymentRepository';
export * from './locationRepository';

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

  listForConsumer: (userId: ID): Promise<Project[]> =>
    request(() => db.projects.filter((project) => project.organizationId === userId)),

  getById: (id: ID): Promise<Project | null> =>
    request(() => db.projects.find((project) => project.id === id) ?? null),

  createForOrganization: (
    organizationId: ID,
    input: {
      name: string;
      code: string;
      location: Address;
      geo: GeoPoint;
      materialIds?: ID[];
      status?: Project['status'];
      startDate?: string;
    },
  ): Promise<Project> =>
    request(() => {
      const today = input.startDate ?? new Date().toISOString().slice(0, 10);
      const project: Project = {
        id: `proj-${db.projects.length + 1}-${Date.now()}`,
        organizationId,
        name: input.name.trim(),
        code: input.code.trim(),
        location: input.location,
        geo: input.geo,
        ...(input.materialIds ? { materialIds: input.materialIds } : {}),
        status: input.status ?? 'ACTIVE',
        startDate: today,
      };

      db.projects.unshift(project);
      return project;
    }),

  createForConsumer: (
    userId: ID,
    input: {
      name: string;
      code: string;
      location: Address;
      geo: GeoPoint;
      materialIds?: ID[];
      status?: Project['status'];
      startDate?: string;
    },
  ): Promise<Project> =>
    request(() => {
      const today = input.startDate ?? new Date().toISOString().slice(0, 10);
      const project: Project = {
        id: `proj-${db.projects.length + 1}-${Date.now()}`,
        organizationId: userId,
        name: input.name.trim(),
        code: input.code.trim(),
        location: input.location,
        geo: input.geo,
        ...(input.materialIds ? { materialIds: input.materialIds } : {}),
        status: input.status ?? 'ACTIVE',
        startDate: today,
      };

      db.projects.unshift(project);
      return project;
    }),
};

export const packageRepository = {
  listByProject: (projectId: ID): Promise<Package[]> =>
    request(() => db.packages.filter((pkg) => pkg.projectId === projectId)),

  listByOrganization: (organizationId: ID): Promise<Package[]> =>
    request(() => db.packages.filter((pkg) => pkg.organizationId === organizationId)),

  getById: (id: ID): Promise<Package | null> =>
    request(() => db.packages.find((pkg) => pkg.id === id) ?? null),

  create: (
    projectId: ID,
    organizationId: ID,
    input: {
      name: string;
      code: string;
      siteAddress: Address;
      siteGeo: GeoPoint;
      status?: Package['status'];
      startDate?: string;
      expectedEndDate?: string;
    },
  ): Promise<Package> =>
    request(() => {
      const today = input.startDate ?? new Date().toISOString().slice(0, 10);
      const pkg: Package = {
        id: `pkg-${db.packages.length + 1}-${Date.now()}`,
        projectId,
        organizationId,
        name: input.name.trim(),
        code: input.code.trim(),
        siteAddress: input.siteAddress,
        siteGeo: input.siteGeo,
        status: input.status ?? 'ACTIVE',
        startDate: today,
        ...(input.expectedEndDate ? { expectedEndDate: input.expectedEndDate } : {}),
      };

      db.packages.unshift(pkg);
      return pkg;
    }),
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

export interface CreateEnquiryInput {
  raisedByUserId: ID;
  raisedByUserType: UserType;
  /** Built via `enquiryScopeFor()` — absent entirely for Normal Consumers. */
  organizationId?: ID;
  projectId?: ID;
  packageId?: ID;
  stockPointId: ID;
  mineralId: ID;
  requiredQuantity: Quantity;
  requiredByDate?: ISODate;
  contactName?: string;
  contactMobileNumber?: string;
  remarks?: string;
}

export const enquiryRepository = {
  /**
   * Records a new mineral requirement against a stock point.
   *
   * Writes to the in-memory store, so the enquiry appears in the list
   * immediately afterwards — the prototype behaves like a connected
   * application rather than a set of screens that forget what you did.
   */
  create: (input: CreateEnquiryInput): Promise<Enquiry> =>
    request(() => {
      const now = new Date().toISOString();
      const sequence = String(db.enquiries.length + 9241).padStart(6, '0');

      const enquiry: Enquiry = {
        id: `enq-${db.enquiries.length + 1}-${Date.now()}`,
        enquiryNumber: `ENQ/2026/${sequence}`,
        raisedByUserId: input.raisedByUserId,
        raisedByUserType: input.raisedByUserType,
        ...(input.organizationId ? { organizationId: input.organizationId } : {}),
        ...(input.projectId ? { projectId: input.projectId } : {}),
        ...(input.packageId ? { packageId: input.packageId } : {}),
        stockPointId: input.stockPointId,
        mineralId: input.mineralId,
        requiredQuantity: input.requiredQuantity,
        ...(input.requiredByDate ? { requiredByDate: input.requiredByDate } : {}),
        ...(input.contactName ? { contactName: input.contactName } : {}),
        ...(input.contactMobileNumber ? { contactMobileNumber: input.contactMobileNumber } : {}),
        ...(input.remarks ? { remarks: input.remarks } : {}),
        /* PROVISIONAL (open question #2): SUBMITTED is the only status a newly
           raised enquiry can truthfully have until the real vocabulary and the
           enquiry-to-order transition are confirmed. */
        status: 'SUBMITTED',
        createdAt: now,
        updatedAt: now,
      };

      db.enquiries.unshift(enquiry);
      return enquiry;
    }),

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

export interface RecordConsumptionInput {
  inventoryBalanceId: ID;
  recordedByUserId: ID;
  quantity: Quantity;
  purpose?: string;
  remarks?: string;
}

export interface RecordConsumptionResult {
  entry: ConsumptionEntry;
  balance: InventoryBalance;
  /** The balance remaining after this draw-down. */
  availableQuantity: Quantity;
}

export const consumptionRepository = {
  /**
   * Records a draw-down against a balance.
   *
   *     Available Quantity → Enter Consumption → Remaining Quantity
   *
   * The policy decision — whether consumption may exceed what is available —
   * is NOT made here. It lives in `canRecordConsumption()` in
   * @/rules/inventoryRules, and is checked both by the screen (so the user is
   * told before they act) and here (so the rule cannot be bypassed).
   */
  record: (input: RecordConsumptionInput): Promise<RecordConsumptionResult> =>
    request(() => {
      const balance = db.inventoryBalances.find(
        (candidate) => candidate.id === input.inventoryBalanceId,
      );
      if (!balance) throw new Error('Inventory balance not found');

      const check = canRecordConsumption(balance, input.quantity);
      if (!check.allowed) throw new Error(check.reason ?? 'Consumption is not allowed');

      const recordedAt = new Date().toISOString();

      const entry: ConsumptionEntry = {
        id: `con-${db.consumptionEntries.length + 1}-${Date.now()}`,
        inventoryBalanceId: balance.id,
        scope: balance.scope,
        mineralId: balance.mineralId,
        quantity: input.quantity,
        recordedAt,
        recordedByUserId: input.recordedByUserId,
        ...(input.purpose ? { purpose: input.purpose } : {}),
        ...(input.remarks ? { remarks: input.remarks } : {}),
      };

      db.consumptionEntries.unshift(entry);
      balance.consumedQuantity = addQuantity(balance.consumedQuantity, input.quantity);
      balance.lastUpdatedAt = recordedAt;

      return {
        entry,
        balance,
        availableQuantity: computeAvailableQuantity(balance),
      };
    }),

  listByBalance: (inventoryBalanceId: ID): Promise<ConsumptionEntry[]> =>
    request(() =>
      db.consumptionEntries
        .filter((entry) => entry.inventoryBalanceId === inventoryBalanceId)
        .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)),
    ),
};

export interface CreateApplicationInput {
  organizationId: ID;
  /** Carried from operating context when present — never asked for again. */
  projectId?: ID;
  packageId?: ID;
  applicant: ApplicantDetails;
  mineralId: ID;
  estimatedQuantity: Quantity;
  excavationMethod: ExcavationMethod;
  purpose: string;
  remarks?: string;
  siteAddress: Address;
  /** Marked on the map by the applicant, not geocoded from the address. */
  siteGeo: GeoPoint;
  village: string;
  surveyNumber: string;
  subDivisionNumber?: string;
  landType: LandType;
  areaInSqm: number;
  depthInMetres?: number;
  fromDate?: ISODate;
  toDate?: ISODate;
  /** Absent when the application was saved as a draft without declaring. */
  declarationAccepted: boolean;
  documents: { kind: ApplicationDocumentKind; fileName: string; documentType: string }[];
}

export const temporaryExcavationRepository = {
  /**
   * Creates an application, optionally submitting it.
   *
   * ORGANIZATION-ONLY. Access is enforced by the TEMPORARY_EXCAVATION
   * capability at the navigation and route level; by the time a call reaches
   * here the caller has already been checked.
   */
  create: (input: CreateApplicationInput): Promise<TemporaryExcavationApplication> =>
    request(() => {
      const now = new Date().toISOString();
      const sequence = String(db.temporaryExcavationApplications.length + 1401).padStart(6, '0');

      const application: TemporaryExcavationApplication = {
        id: `tea-${db.temporaryExcavationApplications.length + 1}-${Date.now()}`,
        /* Created as a draft. Paying the application fee is what submits it,
           and that is where the number loses its DRAFT prefix. */
        applicationNumber: `TEA/2026/DRAFT-${sequence}`,
        organizationId: input.organizationId,
        ...(input.projectId ? { projectId: input.projectId } : {}),
        ...(input.packageId ? { packageId: input.packageId } : {}),
        applicant: input.applicant,
        mineralId: input.mineralId,
        estimatedQuantity: input.estimatedQuantity,
        excavationMethod: input.excavationMethod,
        purpose: input.purpose,
        ...(input.remarks ? { remarks: input.remarks } : {}),
        siteAddress: input.siteAddress,
        /* Taken from the map pin the applicant placed, not geocoded here. */
        siteGeo: input.siteGeo,
        village: input.village,
        surveyNumber: input.surveyNumber,
        ...(input.subDivisionNumber ? { subDivisionNumber: input.subDivisionNumber } : {}),
        landType: input.landType,
        areaInSqm: input.areaInSqm,
        depthInMetres: input.depthInMetres ?? 0,
        fromDate: input.fromDate ?? '',
        toDate: input.toDate ?? '',
        ...(input.declarationAccepted ? { declarationAcceptedAt: now } : {}),
        applicationFee: computeApplicationFee(),
        status: 'DRAFT',
        statusUpdatedAt: now,
        documents: input.documents.map((document, index) => ({
          id: `doc-${Date.now()}-${index}`,
          kind: document.kind,
          fileName: document.fileName,
          documentType: document.documentType,
          uploadedAt: now,
        })),
      };

      db.temporaryExcavationApplications.unshift(application);
      return application;
    }),


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
