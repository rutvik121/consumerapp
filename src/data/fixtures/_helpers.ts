import type { MineralUnit, Quantity } from '@/domain';

/** Terse quantity constructor for fixtures. Brass is the default unit. */
export function q(value: number, unit: MineralUnit = 'Brass'): Quantity {
  return { value, unit };
}

/**
 * All fixture timestamps are relative to NOW, resolved when the module loads.
 *
 * A hardcoded anchor date drifts: a delivery that "arrived an hour ago" starts
 * reading as "19 hours ago", then "3 days ago", and the dataset slowly stops
 * describing a live operation. Deriving the anchor from the current date keeps
 * every relationship in the graph intact while the whole dataset stays fresh
 * however long after it was written the demo is run.
 */
export const TODAY = new Date().toISOString().slice(0, 10);

/** Days before TODAY, as an ISO timestamp in IST. */
export function daysAgo(days: number, time = '09:30:00'): string {
  const date = new Date(`${TODAY}T00:00:00+05:30`);
  date.setDate(date.getDate() - days);
  return `${date.toISOString().slice(0, 10)}T${time}+05:30`;
}

/** Days before TODAY, as an ISO date. */
export function dateDaysAgo(days: number): string {
  return daysAgo(days).slice(0, 10);
}

/** Days after TODAY, as an ISO date. */
export function dateDaysAhead(days: number): string {
  return daysAgo(-days).slice(0, 10);
}

/**
 * Hours before the ACTUAL current moment, as an ISO timestamp.
 *
 * Anchored to real "now" rather than to a fixed hour of the day, so a vehicle
 * that dispatched three hours ago genuinely reads as three hours ago whenever
 * the prototype is opened. Negative values produce future times, used for
 * expected arrivals and permit validity.
 */
export function hoursAgo(hours: number): string {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
}
