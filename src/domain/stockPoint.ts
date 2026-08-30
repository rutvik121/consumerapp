import type { Address, Contact, GeoPoint, ID, Quantity } from './common';

/** PROVISIONAL (open question #2) — confirm the real status vocabulary. */
export type StockPointStatus = 'OPERATIONAL' | 'LIMITED_STOCK' | 'CLOSED';

/**
 * What a Stock Point currently holds of one mineral.
 *
 * NOTE — no price field, deliberately. The Project Context never mentions
 * price, rate, or payment, and explicitly forbids marketplace behaviour.
 * See assumption #2. Do not add pricing without confirmation.
 */
export interface StockPointMineralAvailability {
  mineralId: ID;
  availableQuantity: Quantity;
}

/**
 * The source side of the journey, as the consumer sees it.
 *
 * A Stock Point traces back to a licensed quarry in the wider Mahakhanij
 * ecosystem; that provenance is surfaced read-only for traceability.
 *
 * ASSUMPTION (open question #11): Stock Points are the only source type in V1.
 * There is no direct-from-quarry ordering.
 */
export interface StockPoint {
  id: ID;
  name: string;
  code: string;
  address: Address;
  geo: GeoPoint;
  status: StockPointStatus;
  operatingHours: string;
  contact: Contact;
  minerals: StockPointMineralAvailability[];
  /** Upstream provenance, shown for traceability. */
  sourceQuarryName: string;
  licenceNumber: string;
}

/**
 * Distance is RELATIVE to a destination, so it is never stored on the entity.
 * The repository computes it against the caller's operating context and
 * returns this view type instead.
 */
export interface StockPointSearchResult {
  stockPoint: StockPoint;
  distanceKm: number;
}
