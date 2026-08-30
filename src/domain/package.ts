import type { Address, GeoPoint, ID, ISODate } from './common';

/** PROVISIONAL (open question #2) — confirm the real status vocabulary. */
export type PackageStatus = 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';

/**
 * SCOPE BOUNDARY — Supervisors use a SEPARATE existing application.
 *
 * This type exists purely so the Consumer App can display who the assigned
 * supervisor is as read-only context. Never add supervisor actions, login,
 * dashboards, or workflows to this application.
 */
export interface SupervisorInfo {
  name: string;
  mobileNumber: string;
  employeeCode: string;
}

/**
 * Level 3 of the Organization hierarchy — and THE operational scope.
 *
 * Every Organization mineral operation (enquiry, order, delivery, receiving,
 * inventory, consumption) is scoped to exactly one Package. The Package site
 * is also the delivery destination verified during receiving.
 */
export interface Package {
  id: ID;
  projectId: ID;
  organizationId: ID;
  name: string;
  code: string;
  /** The physical site. Doubles as the delivery destination for receiving. */
  siteAddress: Address;
  siteGeo: GeoPoint;
  status: PackageStatus;
  startDate: ISODate;
  expectedEndDate?: ISODate;
  /** Read-only context only. See SupervisorInfo. */
  supervisor?: SupervisorInfo;
}
