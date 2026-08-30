import type { InventoryBalance, Quantity } from '@/domain';
import { compareQuantity, formatQuantity, subtractQuantity } from './quantity';

/**
 * INVENTORY — the mental model is exactly:
 *
 *     Received − Consumed = Available
 *
 * Nothing else. Do not add reserved/allocated/in-transit buckets without an
 * explicit product decision.
 */
export function computeAvailableQuantity(balance: InventoryBalance): Quantity {
  return subtractQuantity(balance.receivedQuantity, balance.consumedQuantity);
}

export interface ConsumptionCheck {
  allowed: boolean;
  /** User-facing explanation when `allowed` is false. */
  reason?: string;
}

/**
 * THE consumption policy — deliberately isolated in one function.
 *
 * ASSUMPTION #4 (open question #6): the Project Context says consumption
 * "should respect applicable inventory validation" but that if the exact rule
 * is undefined, keep the implementation flexible rather than inventing rules.
 *
 * Current policy: block consumption that exceeds available quantity, with a
 * clear message. If the business instead allows negative balances, or a
 * tolerance, or a supervisor override, change it HERE — no screen contains
 * this rule.
 */
export function canRecordConsumption(
  balance: InventoryBalance,
  requested: Quantity,
): ConsumptionCheck {
  if (requested.value <= 0) {
    return { allowed: false, reason: 'Enter a quantity greater than zero.' };
  }

  const available = computeAvailableQuantity(balance);

  if (compareQuantity(requested, available) > 0) {
    return {
      allowed: false,
      reason: `Only ${formatQuantity(available)} is available.`,
    };
  }

  return { allowed: true };
}
