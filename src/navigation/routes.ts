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
  projectDetails: (projectId: ID = ':projectId') => `/projects/${projectId}`,
  packageDetails: (projectId: ID = ':projectId', packageId: ID = ':packageId') =>
    `/projects/${projectId}/packages/${packageId}`,

  /** Normal Consumer's mineral tab (Increment 3). */
  mineral: '/mineral',

  /* --- Shared operational flows --- */
  stockPoints: '/stock-points',
  stockPointDetails: (stockPointId: ID = ':stockPointId') => `/stock-points/${stockPointId}`,
  enquiries: '/enquiries',
  enquiryDetails: (enquiryId: ID = ':enquiryId') => `/enquiries/${enquiryId}`,
  orders: '/orders',
  orderDetails: (orderId: ID = ':orderId') => `/orders/${orderId}`,
  deliveryTracking: (deliveryId: ID = ':deliveryId') => `/deliveries/${deliveryId}/tracking`,
  receive: '/receive',
  receiveDelivery: (deliveryId: ID = ':deliveryId') => `/receive/${deliveryId}`,
  inventory: '/inventory',

  /** ORGANIZATION ONLY (Increment 7). Guarded by TEMPORARY_EXCAVATION. */
  temporaryExcavation: '/temporary-excavation',

  more: '/more',
} as const;
