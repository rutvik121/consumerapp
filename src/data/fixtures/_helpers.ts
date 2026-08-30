import type { MineralUnit, Quantity } from '@/domain';

/** Terse quantity constructor for fixtures. MT is the default unit. */
export function q(value: number, unit: MineralUnit = 'MT'): Quantity {
  return { value, unit };
}

/**
 * All fixture timestamps are anchored to this date so the dataset stays
 * internally consistent and reads as "this week" whenever the demo is run.
 */
export const TODAY = '2026-08-30';

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

/** Hours before now, as an ISO timestamp. Used for live tracking updates. */
export function hoursAgo(hours: number): string {
  const date = new Date(`${TODAY}T14:00:00+05:30`);
  date.setHours(date.getHours() - hours);
  return date.toISOString();
}
