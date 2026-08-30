import type { Address, GeoPoint, ID, ISODate, ISODateTime, Quantity } from './common';

/**
 * PROVISIONAL (open question #2) — confirm the real status vocabulary.
 */
export type TemporaryExcavationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'QUERY_RAISED'
  | 'APPROVED'
  | 'REJECTED';

/** Supporting document attached to an application. */
export interface ApplicationDocument {
  id: ID;
  fileName: string;
  documentType: string;
  uploadedAt: ISODateTime;
}

/**
 * ORGANIZATION-ONLY WORKFLOW.
 *
 * Access is enforced by the `TEMPORARY_EXCAVATION` capability in @/rules/access
 * at three levels: navigation, home composition, and route guard. A Normal
 * Consumer must never see or reach this feature.
 *
 * SCOPE RULE: Temporary Excavation is the ONLY application type in V1.
 * Do not add other Mahakhanij portal application types.
 *
 * PROVISIONAL (open question #5): the real field list for the application form
 * is not yet defined. The fields below are a reasonable excavation-permit
 * shape and must be confirmed before Increment 7.
 */
export interface TemporaryExcavationApplication {
  id: ID;
  applicationNumber: string;
  organizationId: ID;

  /** Optional — an application may relate to a specific project/package site. */
  projectId?: ID;
  packageId?: ID;

  mineralId: ID;
  estimatedQuantity: Quantity;
  purpose: string;

  siteAddress: Address;
  siteGeo: GeoPoint;
  surveyNumber: string;
  areaInSqm: number;
  depthInMetres: number;

  fromDate: ISODate;
  toDate: ISODate;

  status: TemporaryExcavationStatus;
  submittedAt?: ISODateTime;
  statusUpdatedAt: ISODateTime;
  /** Populated when status is QUERY_RAISED or REJECTED. */
  statusRemarks?: string;
  documents: ApplicationDocument[];
}
