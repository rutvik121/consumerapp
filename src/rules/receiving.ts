import type { Delivery, Order, ReceiptVerification } from '@/domain';

/**
 * RECEIVING — verification of a state-tracked transport transaction.
 *
 * The full flow from the product context:
 *
 *   Vehicle Arrives → Scan QR → Validate Transaction → Verify Vehicle
 *   → Verify Destination → Review Dispatched Quantity
 *   → Enter Actual Received Quantity → Identify Discrepancy
 *   → Confirm Receipt → Update Inventory
 *
 * QR scanning is ONE step inside that, not the experience. What the scan does
 * is resolve a permit; what matters is the four checks it enables.
 */

export type VerificationCheck =
  | 'TRANSACTION_FOUND'
  | 'PERMIT_VALID'
  | 'VEHICLE_MATCHED'
  | 'DESTINATION_MATCHED';

export interface CheckResult {
  check: VerificationCheck;
  label: string;
  passed: boolean;
  /** Shown when the check fails, in the receiver's language. */
  detail: string;
}

export interface VerificationOutcome {
  results: CheckResult[];
  verification: ReceiptVerification;
  /** Every check passed — receiving may proceed. */
  valid: boolean;
}

/**
 * Verifies a scanned permit against the delivery in front of the receiver.
 *
 * The four checks answer four different failure modes, and they are reported
 * separately because "verification failed" tells a site operator nothing —
 * an expired permit, a substituted vehicle and a diverted load are three
 * different problems with three different responses.
 */
export function verifyTransport(
  delivery: Delivery,
  scannedPayload: string,
  now: Date = new Date(),
): VerificationOutcome {
  const permit = delivery.permit;

  const transactionFound = scannedPayload.trim() === permit.qrPayload;
  const permitValid = new Date(permit.validUntil).getTime() >= now.getTime();
  const vehicleMatched =
    permit.vehicleNumber.toUpperCase() === delivery.vehicle.registrationNumber.toUpperCase();
  const destinationMatched = permit.destinationLabel === delivery.destination.label;

  const results: CheckResult[] = [
    {
      check: 'TRANSACTION_FOUND',
      label: 'Transport permit',
      passed: transactionFound,
      detail: transactionFound
        ? permit.etpNumber
        : 'This code does not match any permit for this delivery.',
    },
    {
      check: 'PERMIT_VALID',
      label: 'Permit validity',
      passed: permitValid,
      detail: permitValid
        ? `Valid until ${formatDateTime(permit.validUntil)}`
        : `Expired on ${formatDateTime(permit.validUntil)}`,
    },
    {
      check: 'VEHICLE_MATCHED',
      label: 'Vehicle',
      passed: vehicleMatched,
      detail: vehicleMatched
        ? delivery.vehicle.registrationNumber
        : `Permit names ${permit.vehicleNumber}, vehicle is ${delivery.vehicle.registrationNumber}`,
    },
    {
      check: 'DESTINATION_MATCHED',
      label: 'Destination',
      passed: destinationMatched,
      detail: destinationMatched
        ? delivery.destination.label
        : `Permit names ${permit.destinationLabel}`,
    },
  ];

  return {
    results,
    verification: {
      qrScanned: true,
      permitValid,
      vehicleMatched,
      destinationMatched,
    },
    valid: results.every((result) => result.passed),
  };
}

/**
 * Resolves a scanned or typed value to a permit payload.
 *
 * A receiver can always type the e-TP number printed on the permit — a camera
 * that will not focus in the sun, on a dusty permit, at a site gate is not a
 * reason to be unable to receive a load.
 */
export function permitPayloadFor(input: string, delivery: Delivery): string {
  const trimmed = input.trim().toUpperCase();
  if (trimmed === delivery.permit.etpNumber.toUpperCase()) return delivery.permit.qrPayload;
  return input.trim();
}

/**
 * Recomputes an order's receiving status from its deliveries.
 *
 * Derived rather than set by hand, so the order can never disagree with the
 * receipts underneath it.
 */
export function deriveReceivingStatus(
  order: Order,
  deliveries: Delivery[],
): Order['receivingStatus'] {
  const receipts = deliveries.filter((delivery) => delivery.receipt);
  if (receipts.length === 0) {
    return deliveries.some((delivery) => delivery.status === 'ARRIVED_AT_DESTINATION')
      ? 'AWAITING_RECEIPT'
      : 'NOT_STARTED';
  }

  const anyDiscrepancy = receipts.some((delivery) => delivery.receipt?.hasDiscrepancy);
  const received = receipts.reduce(
    (total, delivery) => total + (delivery.receipt?.receivedQuantity.value ?? 0),
    0,
  );

  /* Everything ordered has been accounted for. */
  if (received >= order.orderedQuantity.value) {
    return anyDiscrepancy ? 'RECEIVED_WITH_DISCREPANCY' : 'RECEIVED';
  }

  return anyDiscrepancy ? 'RECEIVED_WITH_DISCREPANCY' : 'PARTIALLY_RECEIVED';
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
