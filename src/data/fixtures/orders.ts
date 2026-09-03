import type { Order } from '@/domain';
import { CONSUMER_USER_ID, ORGANIZATION_USER_ID } from './users';
import { daysAgo, q } from './_helpers';

/**
 * Enquiry → Order. Every order traces back to the enquiry that produced it.
 *
 * Dispatch and receiving status are tracked separately because an order is
 * fulfilled by one or more Deliveries, each under its own e-TP. ord-001 shows
 * this: two deliveries, one clean, one with a discrepancy.
 */
export const orders: Order[] = [
  {
    id: 'ord-001',
    orderNumber: 'ORD/2026/004412',
    enquiryId: 'enq-001',
    placedByUserId: ORGANIZATION_USER_ID,
    placedByUserType: 'ORGANIZATION',
    organizationId: 'org-001',
    projectId: 'proj-001',
    packageId: 'pkg-001',
    stockPointId: 'sp-001',
    mineralId: 'min-grit',
    orderedQuantity: q(500),
    dispatchStatus: 'PARTIALLY_DISPATCHED',
    receivingStatus: 'PARTIALLY_RECEIVED',
    deliveryIds: ['del-001', 'del-002', 'del-006'],
    createdAt: daysAgo(10),
    updatedAt: daysAgo(2),
  },
  {
    id: 'ord-002',
    orderNumber: 'ORD/2026/004508',
    enquiryId: 'enq-003',
    placedByUserId: ORGANIZATION_USER_ID,
    placedByUserType: 'ORGANIZATION',
    organizationId: 'org-001',
    projectId: 'proj-002',
    packageId: 'pkg-003',
    stockPointId: 'sp-004',
    mineralId: 'min-murum',
    orderedQuantity: q(800),
    dispatchStatus: 'DISPATCHED',
    receivingStatus: 'AWAITING_RECEIPT',
    deliveryIds: ['del-003', 'del-005'],
    createdAt: daysAgo(6),
    updatedAt: daysAgo(0),
  },

  /* --- Normal Consumer orders: 2 DigiTP created orders --- */
  {
    id: 'ord-003',
    orderNumber: 'ORD/2026/004473',
    enquiryId: 'enq-005',
    placedByUserId: CONSUMER_USER_ID,
    placedByUserType: 'NORMAL_CONSUMER',
    stockPointId: 'sp-006',
    mineralId: 'min-sand',
    orderedQuantity: q(12),
    digiTpNumber: 'DTP-2024-8842',
    dispatchStatus: 'DISPATCHED',
    receivingStatus: 'AWAITING_RECEIPT',
    deliveryIds: ['del-004'],
    createdAt: daysAgo(4),
    updatedAt: daysAgo(0),
  },
  {
    id: 'ord-004',
    orderNumber: 'ORD/2026/004491',
    enquiryId: 'enq-002',
    placedByUserId: CONSUMER_USER_ID,
    placedByUserType: 'NORMAL_CONSUMER',
    stockPointId: 'sp-001',
    mineralId: 'min-basalt',
    orderedQuantity: q(500),
    digiTpNumber: 'DTP-2024-7931',
    dispatchStatus: 'DISPATCHED',
    receivingStatus: 'PARTIALLY_RECEIVED',
    deliveryIds: ['del-001'],
    createdAt: daysAgo(2),
    updatedAt: daysAgo(0),
  },
];
