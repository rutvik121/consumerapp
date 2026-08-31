import type { Payment } from '@/domain';
import { daysAgo } from './_helpers';

/**
 * Completed payments against the seeded applications.
 *
 * Every application past DRAFT has an APPLICATION_FEE receipt, because that
 * payment is what submitted it. tea-003 also has a DEMAND_NOTE receipt, which
 * is what produced its excavation order.
 */
export const payments: Payment[] = [
  {
    id: 'pay-001',
    receiptNumber: 'RCPT/2026/0088412',
    applicationId: 'tea-001',
    purpose: 'APPLICATION_FEE',
    amount: { amount: 1000, currency: 'INR' },
    status: 'SUCCESS',
    initiatedAt: daysAgo(11, '10:12:00'),
    completedAt: daysAgo(11, '10:13:00'),
    gatewayReference: 'MHKNJPG-4471902',
    method: 'UPI',
  },
  {
    id: 'pay-002',
    receiptNumber: 'RCPT/2026/0089033',
    applicationId: 'tea-002',
    purpose: 'APPLICATION_FEE',
    amount: { amount: 1000, currency: 'INR' },
    status: 'SUCCESS',
    initiatedAt: daysAgo(9, '15:41:00'),
    completedAt: daysAgo(9, '15:42:00'),
    gatewayReference: 'MHKNJPG-4483115',
    method: 'Net banking',
  },
  {
    id: 'pay-003',
    receiptNumber: 'RCPT/2026/0081204',
    applicationId: 'tea-003',
    purpose: 'APPLICATION_FEE',
    amount: { amount: 1000, currency: 'INR' },
    status: 'SUCCESS',
    initiatedAt: daysAgo(38, '09:05:00'),
    completedAt: daysAgo(38, '09:06:00'),
    gatewayReference: 'MHKNJPG-4390877',
    method: 'UPI',
  },
  {
    id: 'pay-004',
    receiptNumber: 'RCPT/2026/0093781',
    applicationId: 'tea-003',
    purpose: 'DEMAND_NOTE',
    amount: { amount: 403_200, currency: 'INR' },
    status: 'SUCCESS',
    initiatedAt: daysAgo(23, '11:20:00'),
    completedAt: daysAgo(23, '11:24:00'),
    gatewayReference: 'MHKNJPG-4512260',
    method: 'Net banking',
  },
  {
    id: 'pay-005',
    receiptNumber: 'RCPT/2026/0090552',
    applicationId: 'tea-005',
    purpose: 'APPLICATION_FEE',
    amount: { amount: 1000, currency: 'INR' },
    status: 'SUCCESS',
    initiatedAt: daysAgo(16, '08:55:00'),
    completedAt: daysAgo(16, '08:56:00'),
    gatewayReference: 'MHKNJPG-4496338',
    method: 'UPI',
  },
];
