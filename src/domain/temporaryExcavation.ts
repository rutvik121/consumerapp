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

/**
 * WHO IS APPLYING.
 *
 * Captured as its own object rather than flattened onto the application,
 * because the department treats the applicant as a party to the permit: the
 * order is issued to this person at this registered address, and that is not
 * necessarily the organization's own address or its primary contact.
 *
 * The app knows most of this already from the signed-in account, so the form
 * PRE-FILLS it and lets the applicant correct it. Pre-filled is not the same
 * as re-asking.
 */
export type IdProofType = 'AADHAAR' | 'PAN' | 'VOTER_ID' | 'DRIVING_LICENCE';

export interface ApplicantDetails {
  fullName: string;
  mobileNumber: string;
  landlineNumber?: string;
  email?: string;
  idProofType: IdProofType;
  idProofNumber: string;
  panNumber: string;
  aadhaarNumber?: string;
  gstNumber?: string;
  /** Landline or second number the department can reach. */
  alternatePhone?: string;
  registeredAddress: Address;
}

/** Application proposal type as displayed on the desktop portal. */
export type ProposalApplicationType =
  | 'QUARRY_TEMPORARY_PLOT'
  | 'QUARRY_PROJECT_SELF_CONSUMPTION';

/** Proposal clearance level. */
export type ProposalLevel =
  | 'DISTRICT_LEVEL'
  | 'SUB_DIVISIONAL_LEVEL'
  | 'STATE_LEVEL';

/** Rural vs Urban classification for plot/quarry. */
export type LocationCategory = 'RURAL' | 'URBAN';

/** Plot location classification. */
export type PlotLocationType =
  | 'INTERIOR'
  | 'RIVERBED'
  | 'PLAIN_AGRICULTURAL'
  | 'HILLY';

/** Assigned survey record. */
export interface SurveyEntry {
  id: string;
  surveyNumber: string;
  subDivision?: string;
  areaInHectares?: number;
  sevenTwelveAttached?: boolean;
  ownerApprovalAttached?: boolean;
}

/**
 * Who owns the land being excavated. It changes which consents the department
 * expects, which is why it is asked for alongside the survey number rather
 * than buried in the documents step.
 */
export type LandType = 'PRIVATE' | 'GOVERNMENT' | 'GRAM_PANCHAYAT' | 'FOREST' | 'OTHER';

/** How the mineral will be extracted. Drives the department's site scrutiny. */
export type ExcavationMethod = 'MANUAL' | 'SEMI_MECHANISED' | 'MECHANISED';

/**
 * The document checklist. A stable key per row so the checklist, the upload
 * state and the stored document all refer to the same thing.
 */
export type ApplicationDocumentKind =
  /* Core Identity & Land */
  | 'PAN_CARD'
  | 'AADHAAR_CARD'
  | 'GST_CERTIFICATE'
  | 'SEVEN_TWELVE'
  | 'OWNER_APPROVAL'
  /* Legacy keys for backward compatibility */
  | 'SITE_PLAN'
  | 'LAND_RECORD'
  | 'LAND_OWNER_CONSENT'
  | 'IDENTITY_PROOF'
  | 'ENVIRONMENTAL_CLEARANCE'
  /* NOC Documents */
  | 'NOC_PWD'
  | 'NOC_MSEB'
  | 'NOC_MPCB'
  | 'NOC_FOREST'
  | 'NOC_GRAM_PANCHAYAT'
  /* Excavation Permission Documents */
  | 'LAND_MUTATION'
  | 'IOD_CERTIFICATE'
  | 'LOI'
  | 'IOD_APPROVED_BUILDING_PLAN'
  | 'EARTH_WORK_MEASUREMENT'
  | 'BORE_LOG'
  | 'DP_REMARKS'
  /* Other */
  | 'OTHER';

/** Supporting document attached to an application. */
export interface ApplicationDocument {
  id: ID;
  kind: ApplicationDocumentKind;
  fileName: string;
  /** Human label for the kind, resolved at upload time. */
  documentType: string;
  documentNumber?: string;
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
 * FIELD SET: mirrors the Mahakhanij web application form — applicant details,
 * excavation details, quarry and location, documents, declaration. The mobile
 * form asks for the same information in the same order; it does not ask for
 * less. See @/rules/excavation for the step grouping.
 *
 * PROVISIONAL: validation formats (ID proof patterns, area and depth limits)
 * are modelled on the common Maharashtra requirements and must be confirmed
 * against the portal's own rules.
 */
export interface TemporaryExcavationApplication {
  id: ID;
  applicationNumber: string;
  organizationId: ID;

  /** Optional — an application may relate to a specific project/package site. */
  projectId?: ID;
  packageId?: ID;

  /** Party the order is issued to. Pre-filled from the account, editable. */
  applicant: ApplicantDetails;

  /* Desktop application specifications */
  applicationType?: ProposalApplicationType;
  leaseType?: 'TEMPORARY';
  proposalLevel?: ProposalLevel;
  excavationQuantityBrass?: number;
  liftingPeriodDays?: number;
  reasonForApplying?: string;

  mineralId: ID;
  estimatedQuantity: Quantity;
  excavationMethod: ExcavationMethod;
  purpose: string;

  /* Desktop plot, survey and treasury office specifications */
  category?: LocationCategory;
  plotLocationType?: PlotLocationType;
  surveyEntries?: SurveyEntry[];
  totalPlotAreaHectare?: number;
  demandNoteOffice?: string;
  grasOfficeName?: string;

  siteAddress: Address;
  /**
   * Where the site actually is. Set by the map picker, not geocoded from the
   * address — the applicant marks the pit, and the administrative fields are
   * suggested from the pin rather than the other way round.
   */
  siteGeo: GeoPoint;
  /** Village within the taluka. The lowest administrative unit on a 7/12. */
  village: string;
  surveyNumber: string;
  /** Sub-division ("hissa") of the survey number, where one applies. */
  subDivisionNumber?: string;
  landType: LandType;
  areaInSqm: number;
  depthInMetres: number;

  fromDate: ISODate;
  toDate: ISODate;
  /** Free-text note to the reviewing officer. */
  remarks?: string;

  /**
   * When the applicant accepted the declaration on the review step. Absent
   * means the declaration was never accepted, which is why an application
   * cannot reach payment without it.
   */
  declarationAcceptedAt?: ISODateTime;

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
