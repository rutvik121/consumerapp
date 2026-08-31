import type { Delivery, ID, TemporaryExcavationApplication } from '@/domain';
import { formatMoney } from './excavation';
import { formatQuantity } from './quantity';
import type { StatusTone } from './statusPresentation';

/**
 * ATTENTION REQUIRED — what the Organization Home is really for.
 *
 * The Home answers "what is happening across my organization, and what needs
 * my attention?". The second half of that question is this module.
 *
 * An attention item is something the user must ACT on. It is not a status
 * update, not a notification, and not everything that recently changed. If
 * nothing is required of the user, it does not belong here — a list that fills
 * with items nobody can act on teaches people to stop reading it.
 */

export type AttentionKind =
  /** A vehicle has arrived and is waiting to be received. */
  | 'DELIVERY_AWAITING_RECEIPT'
  /** Received quantity did not match dispatched quantity. */
  | 'QUANTITY_DISCREPANCY'
  /** A Temporary Excavation application has a query to answer. */
  | 'APPLICATION_QUERY_RAISED'
  /** A demand note is payable before the excavation order can be issued. */
  | 'DEMAND_NOTE_DUE';

export interface AttentionItem {
  id: ID;
  kind: AttentionKind;
  /**
   * Three lines, ordered by what the user scans for:
   *   title    the problem — this is what they are deciding to act on
   *   subject  the identifier and quantity — vehicle, application number
   *   scope    where it belongs — project and package
   *
   * Split this way so a long vehicle number or application reference is never
   * truncated away; the identifier is the thing the user matches against what
   * is physically in front of them at the gate.
   */
  title: string;
  subject: string;
  scope?: string;
  tone: StatusTone;
  /** Sort weight — lower is more urgent. */
  priority: number;
  /** Ids the screen needs to navigate to the thing itself. */
  deliveryId?: ID;
  applicationId?: ID;
  projectId?: ID;
  packageId?: ID;
}

/**
 * Ordered most urgent first:
 *
 *   1. A vehicle is physically waiting at site. Every minute costs money and
 *      the permit has a validity window.
 *   2. A discrepancy has been recorded. It is a compliance signal and someone
 *      has to account for it.
 *   3. A demand note is due — money owed, with a deadline, and the excavation
 *      order is blocked until it is paid.
 *   4. An application query is blocking review, but nothing is standing idle
 *      and nothing has a payment deadline attached.
 */
const PRIORITY: Record<AttentionKind, number> = {
  DELIVERY_AWAITING_RECEIPT: 1,
  QUANTITY_DISCREPANCY: 2,
  DEMAND_NOTE_DUE: 3,
  APPLICATION_QUERY_RAISED: 4,
};

export interface AttentionInput {
  deliveries: Delivery[];
  applications: TemporaryExcavationApplication[];
  /** Resolves a package id to its display name. */
  packageName: (packageId: ID | undefined) => string | undefined;
}

export function deriveAttentionItems({
  deliveries,
  applications,
  packageName,
}: AttentionInput): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const delivery of deliveries) {
    const scope = packageName(delivery.packageId);

    if (delivery.status === 'ARRIVED_AT_DESTINATION') {
      items.push({
        id: `attn-receipt-${delivery.id}`,
        kind: 'DELIVERY_AWAITING_RECEIPT',
        title: 'Vehicle waiting to be received',
        subject: `${delivery.vehicle.registrationNumber} · ${formatQuantity(delivery.dispatchedQuantity)}`,
        ...(scope ? { scope } : {}),
        tone: 'warning',
        priority: PRIORITY.DELIVERY_AWAITING_RECEIPT,
        deliveryId: delivery.id,
        ...(delivery.projectId ? { projectId: delivery.projectId } : {}),
        ...(delivery.packageId ? { packageId: delivery.packageId } : {}),
      });
      continue;
    }

    const receipt = delivery.receipt;
    if (receipt?.hasDiscrepancy) {
      items.push({
        id: `attn-discrepancy-${delivery.id}`,
        kind: 'QUANTITY_DISCREPANCY',
        title: `Shortage of ${formatQuantity(receipt.differenceQuantity)} recorded`,
        subject: `${delivery.vehicle.registrationNumber} · dispatched ${formatQuantity(receipt.dispatchedQuantity)}, received ${formatQuantity(receipt.receivedQuantity)}`,
        ...(scope ? { scope } : {}),
        tone: 'danger',
        priority: PRIORITY.QUANTITY_DISCREPANCY,
        deliveryId: delivery.id,
        ...(delivery.projectId ? { projectId: delivery.projectId } : {}),
        ...(delivery.packageId ? { packageId: delivery.packageId } : {}),
      });
    }
  }

  for (const application of applications) {
    const scopeIds = {
      applicationId: application.id,
      ...(application.projectId ? { projectId: application.projectId } : {}),
      ...(application.packageId ? { packageId: application.packageId } : {}),
    };

    if (application.status === 'DEMAND_NOTE_ISSUED' && application.demandNote) {
      items.push({
        id: `attn-demand-note-${application.id}`,
        kind: 'DEMAND_NOTE_DUE',
        title: `Demand note of ${formatMoney(application.demandNote.totalAmount)} is due`,
        subject: application.demandNote.demandNoteNumber,
        scope: `Pay by ${formatDueDate(application.demandNote.dueDate)} to receive the excavation order`,
        tone: 'warning',
        priority: PRIORITY.DEMAND_NOTE_DUE,
        ...scopeIds,
      });
      continue;
    }

    if (application.status !== 'QUERY_RAISED') continue;

    items.push({
      id: `attn-application-${application.id}`,
      kind: 'APPLICATION_QUERY_RAISED',
      title: 'Query raised on an application',
      subject: application.applicationNumber,
      scope: application.statusRemarks ?? 'A response is required before review continues.',
      tone: 'warning',
      priority: PRIORITY.APPLICATION_QUERY_RAISED,
      ...scopeIds,
    });
  }

  return items.sort((a, b) => a.priority - b.priority);
}

/** Applications that are still in flight — neither approved nor rejected. */
export function isApplicationActive(application: TemporaryExcavationApplication): boolean {
  return (
    application.status !== 'ORDER_ISSUED' &&
    application.status !== 'REJECTED'
  );
}

/** Deliveries still moving or waiting — not yet settled by a receipt. */
export function isDeliveryActive(delivery: Delivery): boolean {
  return delivery.status !== 'RECEIVED' && delivery.status !== 'RECEIVED_WITH_DISCREPANCY';
}

/** Can this delivery be received right now? Drives the Receive action. */
export function canReceiveDelivery(delivery: Delivery): boolean {
  return delivery.status === 'ARRIVED_AT_DESTINATION';
}

function formatDueDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
