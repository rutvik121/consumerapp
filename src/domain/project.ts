import type { Address, GeoPoint, ID, ISODate } from './common';

/**
 * PROVISIONAL (open question #2) — confirm the real status vocabulary.
 * Defined in one place so replacement is a single-file change.
 */
export type ProjectStatus = 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';

export type ProjectOwnershipType = 'PRIVATE' | 'GOVERNMENT';
export type ProjectCategory = 'RURAL' | 'URBAN';

/**
 * Level 2 of the Organization hierarchy:
 *   Organization → Project → Package → Mineral Operations
 */
export interface Project {
  id: ID;
  organizationId: ID;
  name: string;
  /** Human-readable reference shown in lists and on documents. */
  code: string;
  projectType?: ProjectOwnershipType;
  department?: string;
  workOrderNumber?: string;
  category?: ProjectCategory;
  city?: string;
  village?: string;
  location: Address;
  geo?: GeoPoint;
  /** Materials commonly required at this project so downstream enquiries can be
   * scoped to the exact construction or excavation use-case. */
  materialIds?: ID[];
  status: ProjectStatus;
  startDate: ISODate;
  expectedEndDate?: ISODate;
}
