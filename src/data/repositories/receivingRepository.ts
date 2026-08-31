import type {
  Delivery,
  DeliveryReceipt,
  DiscrepancyReason,
  ID,
  InventoryBalance,
  InventoryScope,
  Quantity,
  ReceiptVerification,
} from '@/domain';
import { addQuantity, assessDiscrepancy, deriveReceivingStatus } from '@/rules';
import { request } from '../client';
import { db } from '../db';

export interface ConfirmReceiptInput {
  deliveryId: ID;
  receivedByUserId: ID;
  receivedQuantity: Quantity;
  verification: ReceiptVerification;
  discrepancyReason?: DiscrepancyReason;
  remarks?: string;
}

export interface ConfirmReceiptResult {
  delivery: Delivery;
  receipt: DeliveryReceipt;
  /** The balance after this receipt — what the user now holds. */
  inventoryBalance: InventoryBalance;
  availableQuantity: Quantity;
}

/**
 * CONFIRM RECEIPT — the app's most consequential write.
 *
 * One call, because these five effects are a single operational fact and must
 * never be able to disagree with one another:
 *
 *   1. the receipt is recorded against the delivery
 *   2. the delivery's status reflects whether it was clean or short
 *   3. the movement record gains a final entry
 *   4. the order's receiving status is recomputed from ALL its deliveries
 *   5. inventory increases by what actually arrived — not what was dispatched
 *
 * Step 5 is the whole point of the traceability chain. Inventory is credited
 * with the RECEIVED quantity, so a 3 MT shortfall stays a 3 MT shortfall all
 * the way through to what the site can consume.
 *
 * In production this is one transactional endpoint. The composition is kept
 * here so the future team can see exactly what that endpoint must do.
 */
export const receivingRepository = {
  confirmReceipt: (input: ConfirmReceiptInput): Promise<ConfirmReceiptResult> =>
    request(() => {
      const delivery = db.deliveries.find((candidate) => candidate.id === input.deliveryId);
      if (!delivery) throw new Error('Delivery not found');

      const discrepancy = assessDiscrepancy(delivery.dispatchedQuantity, input.receivedQuantity);
      const receivedAt = new Date().toISOString();

      /* 1. The receipt — an immutable record of what was asserted on site. */
      const receipt: DeliveryReceipt = {
        receivedAt,
        receivedByUserId: input.receivedByUserId,
        verification: input.verification,
        dispatchedQuantity: delivery.dispatchedQuantity,
        receivedQuantity: input.receivedQuantity,
        differenceQuantity: discrepancy.difference,
        hasDiscrepancy: discrepancy.hasDiscrepancy,
        ...(input.discrepancyReason ? { discrepancyReason: input.discrepancyReason } : {}),
        ...(input.remarks ? { remarks: input.remarks } : {}),
      };

      /* 2. and 3. The delivery settles, and the movement record closes. */
      delivery.receipt = receipt;
      delivery.status = discrepancy.hasDiscrepancy ? 'RECEIVED_WITH_DISCREPANCY' : 'RECEIVED';
      delivery.tracking.push({
        at: receivedAt,
        status: delivery.status,
        locationLabel: delivery.destination.label,
        ...(discrepancy.hasDiscrepancy
          ? { note: `Shortage of ${discrepancy.difference.value} ${discrepancy.difference.unit} recorded at site.` }
          : { note: 'Quantity matched dispatch.' }),
      });

      /* 4. The order is recomputed from every delivery under it. */
      const order = db.orders.find((candidate) => candidate.id === delivery.orderId);
      if (order) {
        const siblings = db.deliveries.filter((candidate) => candidate.orderId === order.id);
        order.receivingStatus = deriveReceivingStatus(order, siblings);
        order.updatedAt = receivedAt;
      }

      /* 5. Inventory is credited with what ARRIVED, never what was sent. */
      const scope = inventoryScopeFor(delivery, order?.placedByUserId);
      const balance = findOrCreateBalance(scope, delivery.permit.mineralId, receivedAt);
      balance.receivedQuantity = addQuantity(balance.receivedQuantity, input.receivedQuantity);
      balance.lastUpdatedAt = receivedAt;

      return {
        delivery,
        receipt,
        inventoryBalance: balance,
        availableQuantity: {
          value:
            Math.round((balance.receivedQuantity.value - balance.consumedQuantity.value) * 100) /
            100,
          unit: balance.receivedQuantity.unit,
        },
      };
    }),
};

/**
 * Where this mineral lands.
 *
 * Organization deliveries credit the PACKAGE that ordered them; consumer
 * deliveries credit the person. One concept, two scopes — the same union that
 * lets inventory be built once.
 */
function inventoryScopeFor(delivery: Delivery, placedByUserId: ID | undefined): InventoryScope {
  if (delivery.organizationId && delivery.projectId && delivery.packageId) {
    return {
      kind: 'PACKAGE',
      organizationId: delivery.organizationId,
      projectId: delivery.projectId,
      packageId: delivery.packageId,
    };
  }

  if (!placedByUserId) throw new Error('Cannot resolve an inventory scope for this delivery');
  return { kind: 'CONSUMER', userId: placedByUserId };
}

/** A first receipt of a mineral into a scope opens its balance. */
function findOrCreateBalance(
  scope: InventoryScope,
  mineralId: ID,
  at: string,
): InventoryBalance {
  const existing = db.inventoryBalances.find(
    (balance) => balance.mineralId === mineralId && sameScope(balance.scope, scope),
  );
  if (existing) return existing;

  const created: InventoryBalance = {
    id: `inv-${db.inventoryBalances.length + 1}-${Date.now()}`,
    scope,
    mineralId,
    receivedQuantity: { value: 0, unit: 'MT' },
    consumedQuantity: { value: 0, unit: 'MT' },
    lastUpdatedAt: at,
  };

  db.inventoryBalances.push(created);
  return created;
}

function sameScope(a: InventoryScope, b: InventoryScope): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'PACKAGE' && b.kind === 'PACKAGE') return a.packageId === b.packageId;
  if (a.kind === 'CONSUMER' && b.kind === 'CONSUMER') return a.userId === b.userId;
  return false;
}
