import type { Delivery, Order, Quantity } from '@/domain';
import { distanceInKm } from './geo';
import { addQuantity, subtractQuantity } from './quantity';

/**
 * ORDER FULFILMENT — how much of an order has actually moved.
 *
 * An Order is the commercial envelope; the physical movement happens in one or
 * more Deliveries, each under its own e-TP. So "how much is left" is never a
 * field on the order — it is derived from the deliveries, which is also why
 * dispatch and receiving are tracked separately.
 */
export interface OrderFulfilment {
  ordered: Quantity;
  dispatched: Quantity;
  received: Quantity;
  /** Ordered − dispatched. What the source still owes. */
  pendingDispatch: Quantity;
  /** Dispatched − received. What is in transit or waiting at the gate. */
  awaitingReceipt: Quantity;
  /** Cumulative shortfall across every receipt on this order. */
  totalDiscrepancy: Quantity;
}

export function summarizeFulfilment(order: Order, deliveries: Delivery[]): OrderFulfilment {
  const unit = order.orderedQuantity.unit;
  const zero: Quantity = { value: 0, unit };

  const dispatched = deliveries.reduce(
    (running, delivery) => addQuantity(running, delivery.dispatchedQuantity),
    zero,
  );

  const received = deliveries.reduce(
    (running, delivery) =>
      delivery.receipt ? addQuantity(running, delivery.receipt.receivedQuantity) : running,
    zero,
  );

  const totalDiscrepancy = deliveries.reduce(
    (running, delivery) =>
      delivery.receipt?.hasDiscrepancy
        ? addQuantity(running, delivery.receipt.differenceQuantity)
        : running,
    zero,
  );

  return {
    ordered: order.orderedQuantity,
    dispatched,
    received,
    pendingDispatch: subtractQuantity(order.orderedQuantity, dispatched),
    awaitingReceipt: subtractQuantity(dispatched, received),
    totalDiscrepancy,
  };
}

/**
 * How far along the route a delivery is, as a fraction from 0 to 1.
 *
 * Derived from ACTUAL POSITION where the vehicle has reported one: how much of
 * the source-to-destination distance still remains. That is a real measurement
 * rather than a decorative animation, which matters — a progress bar that
 * moves on a timer rather than on evidence is exactly the food-delivery
 * styling the product context rules out.
 *
 * Falls back to a status mapping when no location has been reported yet.
 */
export function deliveryProgress(delivery: Delivery): number {
  if (delivery.status === 'ARRIVED_AT_DESTINATION') return 1;
  if (delivery.status === 'RECEIVED' || delivery.status === 'RECEIVED_WITH_DISCREPANCY') return 1;
  if (delivery.status === 'SCHEDULED') return 0;

  const destination = delivery.destination.geo;
  const source = delivery.tracking.find((update) => update.geo)?.geo;
  const latest = [...delivery.tracking].reverse().find((update) => update.geo)?.geo;

  if (!source || !latest) {
    return delivery.status === 'IN_TRANSIT' ? 0.5 : 0.15;
  }

  const total = distanceInKm(source, destination);
  if (total <= 0) return 1;

  const remaining = distanceInKm(latest, destination);
  return clamp(1 - remaining / total, 0.05, 0.95);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** "2 hours ago" — how stale is this tracking information? */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const minutes = Math.round((now.getTime() - new Date(iso).getTime()) / 60000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;

  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}
