import type { MineralUnit, Quantity } from '@/domain';

/**
 * Quantity arithmetic and formatting.
 *
 * Quantities are the most safety-critical numbers in this product — a
 * discrepancy between dispatched and received quantity is a compliance signal.
 * All arithmetic goes through here so unit mismatches can never pass silently.
 */

export class UnitMismatchError extends Error {
  constructor(a: MineralUnit, b: MineralUnit) {
    super(`Cannot combine quantities with different units: ${a} and ${b}`);
    this.name = 'UnitMismatchError';
  }
}

function assertSameUnit(a: Quantity, b: Quantity): void {
  if (a.unit !== b.unit) throw new UnitMismatchError(a.unit, b.unit);
}

export function quantity(value: number, unit: MineralUnit = 'Brass'): Quantity {
  return { value, unit };
}

export function addQuantity(a: Quantity, b: Quantity): Quantity {
  assertSameUnit(a, b);
  return { value: round(a.value + b.value), unit: a.unit };
}

export function subtractQuantity(a: Quantity, b: Quantity): Quantity {
  assertSameUnit(a, b);
  return { value: round(a.value - b.value), unit: a.unit };
}

export function compareQuantity(a: Quantity, b: Quantity): number {
  assertSameUnit(a, b);
  return a.value - b.value;
}

export function isZeroQuantity(q: Quantity): boolean {
  return Math.abs(q.value) < 1e-9;
}

/** Quantities are tracked to 2 decimal places. Avoids float drift in sums. */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** "1,240 MT" — grouped, unit-suffixed. Use wherever a quantity is displayed. */
export function formatQuantity(q: Quantity): string {
  return `${formatQuantityValue(q)} ${q.unit}`;
}

/** "1,240" — the bare number, for when the unit is rendered separately. */
export function formatQuantityValue(q: Quantity): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(q.value);
}

/** "+3 MT" / "−3 MT" — signed, for discrepancy display. */
export function formatSignedQuantity(q: Quantity): string {
  if (isZeroQuantity(q)) return `0 ${q.unit}`;
  const sign = q.value > 0 ? '+' : '−';
  return `${sign}${formatQuantityValue({ ...q, value: Math.abs(q.value) })} ${q.unit}`;
}
