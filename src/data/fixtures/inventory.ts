import type { InventoryBalance } from '@/domain';
import { CONSUMER_USER_ID } from './users';
import { daysAgo, q } from './_helpers';

/**
 * Receiving → Inventory.
 *
 *     Received − Consumed = Available
 *
 * Note the scope discriminator: organization balances are held PER PACKAGE,
 * consumer balances are held against the user. One concept, two scopes —
 * which is exactly why inventory does not need to be built twice.
 *
 * inv-001 traces directly to the deliveries: 50 MT (del-001) + 47 MT (del-002)
 * = 97 MT received. The discrepancy is already reflected in the balance.
 *
 * inv-004 is intentionally fully consumed (available = 0) so the empty and
 * blocked-consumption states have real data to exercise.
 */
export const inventoryBalances: InventoryBalance[] = [
  {
    id: 'inv-001',
    scope: { kind: 'PACKAGE', organizationId: 'org-001', projectId: 'proj-001', packageId: 'pkg-001' },
    mineralId: 'min-grit',
    receivedQuantity: q(97),
    consumedQuantity: q(32),
    lastUpdatedAt: daysAgo(1, '16:20:00'),
  },
  {
    id: 'inv-002',
    scope: { kind: 'PACKAGE', organizationId: 'org-001', projectId: 'proj-001', packageId: 'pkg-001' },
    mineralId: 'min-sand',
    receivedQuantity: q(120),
    consumedQuantity: q(85),
    lastUpdatedAt: daysAgo(3, '15:05:00'),
  },
  {
    id: 'inv-003',
    scope: { kind: 'PACKAGE', organizationId: 'org-001', projectId: 'proj-002', packageId: 'pkg-003' },
    mineralId: 'min-murum',
    receivedQuantity: q(260),
    consumedQuantity: q(190),
    lastUpdatedAt: daysAgo(2, '12:40:00'),
  },
  {
    id: 'inv-004',
    scope: { kind: 'PACKAGE', organizationId: 'org-001', projectId: 'proj-001', packageId: 'pkg-002' },
    mineralId: 'min-trap',
    receivedQuantity: q(180),
    consumedQuantity: q(180),
    lastUpdatedAt: daysAgo(7, '17:15:00'),
  },
  {
    id: 'inv-005',
    scope: { kind: 'PACKAGE', organizationId: 'org-001', projectId: 'proj-002', packageId: 'pkg-004' },
    mineralId: 'min-grit',
    receivedQuantity: q(340),
    consumedQuantity: q(96),
    lastUpdatedAt: daysAgo(4, '11:30:00'),
  },

  /* --- Normal Consumer: flat scope, no package. --- */
  {
    id: 'inv-006',
    scope: { kind: 'CONSUMER', userId: CONSUMER_USER_ID },
    mineralId: 'min-sand',
    receivedQuantity: q(24),
    consumedQuantity: q(9),
    lastUpdatedAt: daysAgo(5, '10:10:00'),
  },
];
