import type { Quantity } from '@/domain';
import { isZeroQuantity, subtractQuantity } from './quantity';

/**
 * QUANTITY DISCREPANCY — a compliance signal, never an inventory footnote.
 *
 * The whole Mahakhanij ecosystem exists to close the gap between what was
 * permitted/dispatched and what actually arrived. The receiving flow must
 * surface this prominently:
 *
 *     Dispatched Quantity   50 MT
 *     Received Quantity     47 MT
 *     Difference             3 MT
 */

export type DiscrepancyKind = 'NONE' | 'SHORTAGE' | 'EXCESS';

/**
 * Tolerance below which a difference is not treated as a discrepancy.
 *
 * PROVISIONAL (open question #6): set to zero — every difference counts —
 * because no tolerance has been confirmed. If the business defines a
 * weighbridge tolerance, change this constant only.
 */
export const DISCREPANCY_TOLERANCE = 0;

export interface DiscrepancyAssessment {
  kind: DiscrepancyKind;
  hasDiscrepancy: boolean;
  /** dispatched − received. Positive = shortage, negative = excess. */
  difference: Quantity;
}

export function assessDiscrepancy(
  dispatched: Quantity,
  received: Quantity,
): DiscrepancyAssessment {
  const difference = subtractQuantity(dispatched, received);

  if (isZeroQuantity(difference) || Math.abs(difference.value) <= DISCREPANCY_TOLERANCE) {
    return { kind: 'NONE', hasDiscrepancy: false, difference: { ...difference, value: 0 } };
  }

  return {
    kind: difference.value > 0 ? 'SHORTAGE' : 'EXCESS',
    hasDiscrepancy: true,
    difference,
  };
}
