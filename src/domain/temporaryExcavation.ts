import type { Address, GeoPoint, ID, ISODate, ISODateTime, Money, Quantity } from './common';

/**
 * THE APPLICATION LIFECYCLE, GATED BY TWO PAYMENTS.
 *
 *   DRAFT
 *     └─ pay APPLICATION FEE ──▶ SUBMITTED   (automatic on payment success)
 *   SUBMITTED
 *     └─▶ UNDER_REVIEW
 *           ├─▶ QUERY_RAISED       department is waiting on the applicant
 *           ├─▶ REJECTED           terminal
 *           └─▶ DEMAND_NOTE_ISSUED applicant owes the demand note
 *                 └─ pay DEMAND NOTE ──▶ ORDER_ISSUED   (excavation order)
 *
 * The two payments are the only points where the applicant advances the
 * status. Everything between them is the department's.
 *
 * There is deliberately no APPROVED state: approval is expressed by the
 * department raising a demand note, and the order that follows payment is what
 * the applicant actually needs.
 */
export type TemporaryExcavationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'QUERY_RAISED'
  | 'DEMAND_NOTE_ISSUED'
  | 'ORDER_ISSUED'
  | 'REJECTED';

/**
 * The charge raised by the department once an application clears review.
 *
 * Broken down rather than given as one figure, because an applicant checking a
 * demand note against their own estimate needs to see which component differs.
 *
 * PROVISIONAL: the real heads of charge and their rates are unconfirmed. The
 * components modelled here (royalty, District Mineral Foundation, and a
 * district cess) reflect the common structure of a Maharashtra minor-mineral
 * demand note and must be confirmed against the real schedule.
 */
export interface DemandNote {
  demandNoteNumber: string;
  issuedAt: ISODateTime;
  dueDate: ISODate;
  totalAmount: Money;
  breakdown: { label: string; amount: Money }[];
}

/**
 * What the applicant is ultimately after: permission to excavate.
 *
 * Named ExcavationOrder to keep it distinct from a mineral purchase `Order`.
 * They are unrelated concepts that unfortunately share a word.
 */
export interface ExcavationOrder {
  orderNumber: string;
  issuedAt: ISODateTime;
  validFrom: ISODate;
  validUntil: ISODate;
  permittedQuantity: Quantity;
}

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

  /**
   * The fee payable before this application can be submitted.
   * Set at creation; see `computeApplicationFee()`.
   */
  applicationFee: Money;

  status: TemporaryExcavationStatus;
  submittedAt?: ISODateTime;

  /** Present from DEMAND_NOTE_ISSUED onwards. */
  demandNote?: DemandNote;

  /** Present once the demand note is paid. The end of the workflow. */
  excavationOrder?: ExcavationOrder;
  statusUpdatedAt: ISODateTime;
  /** Populated when status is QUERY_RAISED or REJECTED. */
  statusRemarks?: string;
  documents: ApplicationDocument[];
}
