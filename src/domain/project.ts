import type { Address, GeoPoint, ID, ISODate } from './common';

/**
 * PROVISIONAL (open question #2) — confirm the real status vocabulary.
 * Defined in one place so replacement is a single-file change.
 */
export type ProjectStatus = 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';

/**
 * Level 2 of the Organization hierarchy:
 *   Organization → Project → Package → Mineral Operations
 *
 * A Project groups Packages. It is contextual information for downstream
 * operations — it is not itself an operational scope. Mineral activity always
 * hangs off a Package, never directly off a Project.
 */
export interface Project {
  id: ID;
  organizationId: ID;
  name: string;
  /** Human-readable reference shown in lists and on documents. */
  code: string;
  location: Address;
  geo: GeoPoint;
  status: ProjectStatus;
  startDate: ISODate;
  expectedEndDate?: ISODate;
}
