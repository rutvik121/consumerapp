import type { InventoryBalance, MineralUnit, Quantity } from '@/domain';
import { computeAvailableQuantity } from './inventoryRules';
import { addQuantity } from './quantity';

/**
 * Totals available quantity across many balances.
 *
 * Grouped BY UNIT rather than summed into one number, because adding metric
 * tonnes to cubic metres would produce a figure that looks authoritative and
 * means nothing. Current data is all MT, so this returns a single entry — but
 * the moment brass or cubic metres appear it stays correct instead of silently
 * lying.
 *
 * Sorted largest first, so a screen showing only the headline figure shows the
 * most significant one.
 */
export function summarizeAvailableByUnit(balances: InventoryBalance[]): Quantity[] {
  const totals = new Map<MineralUnit, Quantity>();

  for (const balance of balances) {
    const available = computeAvailableQuantity(balance);
    const running = totals.get(available.unit);
    totals.set(available.unit, running ? addQuantity(running, available) : available);
  }

  return [...totals.values()].sort((a, b) => b.value - a.value);
}

/** Convenience for the headline figure. Null when there is nothing to show. */
export function primaryAvailable(balances: InventoryBalance[]): Quantity | null {
  return summarizeAvailableByUnit(balances)[0] ?? null;
}
