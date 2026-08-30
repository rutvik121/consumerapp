/**
 * Shared primitives used across every domain entity.
 *
 * These are product concepts, not UI concepts. Nothing in this folder may
 * import from `@/design-system`, `@/screens`, or `@/state`.
 */

/** Opaque identifier. Real API will supply these; mock data mimics the shape. */
export type ID = string;

/** ISO-8601 timestamp, e.g. "2026-08-24T09:15:00+05:30". */
export type ISODateTime = string;

/** ISO-8601 date, e.g. "2026-08-24". */
export type ISODate = string;

/**
 * Unit of measure for minor minerals.
 *
 * OPEN QUESTION (#2 in the analysis): Maharashtra minor-mineral operations
 * commonly use BRASS (100 cu ft) for sand and aggregate alongside MT. The
 * Project Context uses MT throughout, so MT is the default. BRASS and CUM are
 * modelled but unused until confirmed.
 */
export type MineralUnit = 'MT' | 'CUM' | 'BRASS';

/** A quantity is always a value AND a unit. Never pass a bare number around. */
export interface Quantity {
  value: number;
  unit: MineralUnit;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Address {
  line1: string;
  /** Taluka / tehsil — the administrative unit below district in Maharashtra. */
  taluka: string;
  district: string;
  state: string;
  pincode: string;
}

export interface Contact {
  name: string;
  mobileNumber: string;
}

/**
 * Where a delivery is legally and operationally destined.
 *
 * For ORGANIZATION users this resolves to a Package site.
 * For NORMAL_CONSUMER users this resolves to their registered delivery
 * location. Receiving verification compares the e-TP destination against this.
 */
export interface Destination {
  label: string;
  address: Address;
  geo: GeoPoint;
}
