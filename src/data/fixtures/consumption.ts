import type { ConsumptionEntry } from '@/domain';
import { CONSUMER_USER_ID, ORGANIZATION_USER_ID } from './users';
import { daysAgo, q } from './_helpers';

/** Inventory → Consumption. The final step of the mineral lifecycle. */
export const consumptionEntries: ConsumptionEntry[] = [
  {
    id: 'con-001',
    inventoryBalanceId: 'inv-001',
    scope: { kind: 'PACKAGE', organizationId: 'org-001', projectId: 'proj-001', packageId: 'pkg-001' },
    mineralId: 'min-grit',
    quantity: q(18),
    recordedAt: daysAgo(4, '17:30:00'),
    recordedByUserId: ORGANIZATION_USER_ID,
    purpose: 'Sub-base layer, Km 18 to Km 20',
  },
  {
    id: 'con-002',
    inventoryBalanceId: 'inv-001',
    scope: { kind: 'PACKAGE', organizationId: 'org-001', projectId: 'proj-001', packageId: 'pkg-001' },
    mineralId: 'min-grit',
    quantity: q(14),
    recordedAt: daysAgo(1, '16:20:00'),
    recordedByUserId: ORGANIZATION_USER_ID,
    purpose: 'Sub-base layer, Km 20 to Km 22',
  },
  {
    id: 'con-003',
    inventoryBalanceId: 'inv-003',
    scope: { kind: 'PACKAGE', organizationId: 'org-001', projectId: 'proj-002', packageId: 'pkg-003' },
    mineralId: 'min-murum',
    quantity: q(120),
    recordedAt: daysAgo(5, '14:00:00'),
    recordedByUserId: ORGANIZATION_USER_ID,
    purpose: 'Backfilling, north face',
  },
  {
    id: 'con-004',
    inventoryBalanceId: 'inv-003',
    scope: { kind: 'PACKAGE', organizationId: 'org-001', projectId: 'proj-002', packageId: 'pkg-003' },
    mineralId: 'min-murum',
    quantity: q(70),
    recordedAt: daysAgo(2, '12:40:00'),
    recordedByUserId: ORGANIZATION_USER_ID,
    purpose: 'Backfilling, south face',
  },
  {
    id: 'con-005',
    inventoryBalanceId: 'inv-006',
    scope: { kind: 'CONSUMER', userId: CONSUMER_USER_ID },
    mineralId: 'min-sand',
    quantity: q(9),
    recordedAt: daysAgo(5, '10:10:00'),
    recordedByUserId: CONSUMER_USER_ID,
    purpose: 'Plinth filling',
  },
];
