import type { ID } from '@/domain';

/**
 * ROUTE REGISTRY — every path in the application, defined once.
 *
 * Screens navigate with these builders, never with hand-written strings, so
 * that a URL shape can be changed in one place. This is also the map the
 * future Flutter team reads to build the Navigator route table.
 */
export const ROUTES = {
  /* --- Authentication (Increment 1) ---
     Splash → Welcome → Login/Register → Mobile Number → OTP → Experience */
  splash: '/',
  welcome: '/welcome',
  login: '/login',
  register: '/register',
  verify: '/verify',

  /** PROTOTYPE ONLY — a review shortcut, no longer the entry point. */
  personaPicker: '/prototype/persona',

  home: '/home',

  /* --- Organization hierarchy (Increment 2) --- */
  projects: '/projects',
  createProject: '/projects/new',
  projectDetails: (projectId: ID = ':projectId') => `/projects/${projectId}`,
  createPackage: (projectId: ID = ':projectId') => `/projects/${projectId}/packages/new`,
  packageDetails: (projectId: ID = ':projectId', packageId: ID = ':packageId') =>
    `/projects/${projectId}/packages/${packageId}`,
  supervisors: '/supervisors',
  registerSupervisor: '/supervisors/new',

  /** Normal Consumer's mineral tab (Increment 3). */
  mineral: '/mineral',
  consumerProjects: '/consumer/projects',
  consumerProjectRegistration: '/consumer/projects/new',

  /* --- Shared operational flows --- */
  /** Map-first stock-point discovery; the list is available from its drawer. */
  stockPoints: '/stock-points',
  stockPointDetails: (stockPointId: ID = ':stockPointId') => `/stock-points/${stockPointId}`,
  /** Raising an enquiry always starts from a chosen stock point. */
  createEnquiry: (stockPointId: ID = ':stockPointId') =>
    `/stock-points/${stockPointId}/enquiry`,
  enquiries: '/enquiries',
  enquiryDetails: (enquiryId: ID = ':enquiryId') => `/enquiries/${enquiryId}`,
  orders: '/orders',
  orderDetails: (orderId: ID = ':orderId') => `/orders/${orderId}`,
  deliveryTracking: (deliveryId: ID = ':deliveryId') => `/deliveries/${deliveryId}/tracking`,
  liveVehicleTracking: (deliveryId: ID = ':deliveryId') => `/deliveries/${deliveryId}/live-tracking`,
  receive: '/receive',
  receiveDelivery: (deliveryId: ID = ':deliveryId') => `/receive/${deliveryId}`,
  inventory: '/inventory',
  inventoryBalance: (balanceId: ID = ':balanceId') => `/inventory/${balanceId}`,

  /** ORGANIZATION ONLY (Increment 7). Guarded by TEMPORARY_EXCAVATION. */
  temporaryExcavation: '/temporary-excavation',
  newExcavationApplication: '/temporary-excavation/new',
  excavationApplication: (applicationId: ID = ':applicationId') =>
    `/temporary-excavation/${applicationId}`,
  /** Payment is always FOR an application, and always for one purpose. */
  applicationPayment: (
    applicationId: ID = ':applicationId',
    purpose: string = ':purpose',
  ) => `/temporary-excavation/${applicationId}/pay/${purpose}`,

  more: '/more',
} as const;
