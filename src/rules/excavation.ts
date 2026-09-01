import type {
  ApplicationDocumentKind,
  DemandNote,
  ExcavationMethod,
  GeoPoint,
  IdProofType,
  LandType,
  Money,
  Quantity,
  TemporaryExcavationApplication,
} from '@/domain';

/**
 * TEMPORARY EXCAVATION — the one compliance workflow in scope, and the one
 * feature that is ORGANIZATION-ONLY.
 *
 * WHAT THIS APP OWNS, AND WHAT IT DOES NOT.
 *
 * The applicant advances the status at exactly two points, and both are
 * payments:
 *
 *   pay the APPLICATION FEE  → the application is submitted, automatically
 *   pay the DEMAND NOTE      → the excavation order is issued
 *
 * Everything in between — review, queries, raising the demand note, rejection
 * — is the department's and arrives here as status. That boundary is why there
 * is no approve, no reject and no respond-to-query action anywhere: inventing
 * one would put a decision in the applicant's hands that is not theirs.
 *
 * The field set below mirrors the Mahakhanij web application form. The mobile
 * form asks the same questions in the same order; it is the same application,
 * on a smaller screen.
 */

/* ---------------------------------------------------------------------------
 * THE APPLICATION FORM
 *
 * The mobile form asks for the SAME information as the Mahakhanij web form,
 * in the same order, grouped into five steps:
 *
 *   1 APPLICANT   who is applying, and where they are registered
 *   2 EXCAVATION  what is being extracted, how, how much and when
 *   3 LOCATION    which quarry — administrative units, survey number, and the
 *                 pin on the map
 *   4 DOCUMENTS   the checklist the department expects
 *   5 REVIEW      read it back, accept the declaration, pay
 *
 * Steps rather than one long form: the web form has the room to show every
 * field at once and a phone does not. The grouping is by the question each
 * step answers, so a step is never a scroll position with a heading on it.
 * ------------------------------------------------------------------------ */

/** Ordered option lists. Labels live in @/content — these are the keys. */
export const ID_PROOF_TYPES: IdProofType[] = ['AADHAAR', 'PAN', 'VOTER_ID', 'DRIVING_LICENCE'];

export const LAND_TYPES: LandType[] = [
  'PRIVATE',
  'GOVERNMENT',
  'GRAM_PANCHAYAT',
  'FOREST',
  'OTHER',
];

export const EXCAVATION_METHODS: ExcavationMethod[] = [
  'MANUAL',
  'SEMI_MECHANISED',
  'MECHANISED',
];

/**
 * THE DOCUMENT CHECKLIST.
 *
 * Shown as a checklist rather than an "attach files" button because the
 * applicant needs to know what is expected BEFORE they start hunting for
 * files. Optional rows are marked optional; they are not hidden, because
 * "may I also attach my clearance?" is a real question.
 *
 * PROVISIONAL: the required set is modelled on what a Maharashtra temporary
 * excavation permit commonly asks for and must be confirmed.
 */
export interface RequiredDocument {
  kind: ApplicationDocumentKind;
  required: boolean;
}

export const APPLICATION_DOCUMENTS: RequiredDocument[] = [
  { kind: 'SITE_PLAN', required: true },
  { kind: 'LAND_RECORD', required: true },
  { kind: 'LAND_OWNER_CONSENT', required: true },
  { kind: 'IDENTITY_PROOF', required: true },
  { kind: 'ENVIRONMENTAL_CLEARANCE', required: false },
  { kind: 'OTHER', required: false },
];

/** Which mandatory rows are still empty. Drives both the error and the count. */
export function missingRequiredDocuments(
  attached: readonly ApplicationDocumentKind[],
): ApplicationDocumentKind[] {
  return APPLICATION_DOCUMENTS.filter(
    (document) => document.required && !attached.includes(document.kind),
  ).map((document) => document.kind);
}

/**
 * THE DRAFT.
 *
 * Deliberately flat and all-strings-or-null: it is what the form holds while
 * it is being filled, which is not the same shape as the entity it eventually
 * becomes. Codes (`districtCode`, `talukaCode`, `villageCode`) are carried
 * alongside names so the cascade can narrow the next dropdown while the
 * application still stores human-readable names.
 */
export interface ApplicationDraft {
  /* 1 · Applicant — pre-filled from the signed-in account, editable. */
  fullName: string;
  mobileNumber: string;
  email: string;
  idProofType: IdProofType | '';
  idProofNumber: string;
  alternatePhone: string;
  registeredAddressLine: string;
  registeredTaluka: string;
  registeredDistrict: string;
  registeredPincode: string;

  /* 2 · Excavation */
  mineralId: string;
  estimatedQuantity: number | null;
  excavationMethod: ExcavationMethod | '';
  depthInMetres: number | null;
  fromDate: string;
  toDate: string;
  purpose: string;
  remarks: string;

  /* 3 · Quarry and location */
  districtCode: string;
  districtName: string;
  talukaCode: string;
  talukaName: string;
  villageCode: string;
  villageName: string;
  surveyNumber: string;
  subDivisionNumber: string;
  landType: LandType | '';
  areaInSqm: number | null;
  addressLine: string;
  pincode: string;
  /** Set by the map picker. Null until the applicant marks the site. */
  siteGeo: GeoPoint | null;

  /* 5 · Review */
  declarationAccepted: boolean;
}

export type ApplicationStep = 'APPLICANT' | 'EXCAVATION' | 'LOCATION' | 'DOCUMENTS' | 'REVIEW';

export const APPLICATION_STEPS: ApplicationStep[] = [
  'APPLICANT',
  'EXCAVATION',
  'LOCATION',
  'DOCUMENTS',
  'REVIEW',
];

/**
 * ID-proof formats.
 *
 * PROVISIONAL: these are the public formats of the documents themselves, not
 * a confirmed portal rule. They exist so a typo is caught on the step where it
 * was made rather than by the department three days later.
 */
const ID_PROOF_PATTERNS: Record<IdProofType, { pattern: RegExp; message: string }> = {
  AADHAAR: { pattern: /^\d{12}$/, message: 'Aadhaar is 12 digits.' },
  PAN: { pattern: /^[A-Z]{5}\d{4}[A-Z]$/, message: 'PAN looks like ABCDE1234F.' },
  VOTER_ID: { pattern: /^[A-Z]{3}\d{7}$/, message: 'Voter ID looks like ABC1234567.' },
  DRIVING_LICENCE: {
    pattern: /^[A-Z]{2}\d{2}\s?\d{11}$/,
    message: 'Driving licence looks like MH12 20110012345.',
  },
};

const MOBILE_PATTERN = /^[6-9]\d{9}$/;
const PINCODE_PATTERN = /^[1-9]\d{5}$/;

/**
 * Field-level validation, per step, so errors surface where they are fixable.
 *
 * `attachedDocuments` is passed in rather than held on the draft because
 * attachments are files, not form values — the screen owns them, and this
 * function only needs to know which checklist rows they satisfy.
 */
export function validateApplicationStep(
  step: ApplicationStep,
  draft: ApplicationDraft,
  attachedDocuments: readonly ApplicationDocumentKind[] = [],
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (step === 'APPLICANT') {
    if (!draft.fullName.trim()) errors.fullName = 'Enter the applicant\u2019s full name.';
    if (!MOBILE_PATTERN.test(draft.mobileNumber.trim())) {
      errors.mobileNumber = 'Enter a valid 10-digit mobile number.';
    }
    /* Email is optional, but a wrong one is worse than none: the department
       sends the demand note to it. */
    if (draft.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      errors.email = 'Enter a valid email address.';
    }
    if (!draft.idProofType) errors.idProofType = 'Select an ID proof.';
    if (!draft.idProofNumber.trim()) {
      errors.idProofNumber = 'Enter the ID number.';
    } else if (draft.idProofType) {
      const rule = ID_PROOF_PATTERNS[draft.idProofType];
      if (!rule.pattern.test(draft.idProofNumber.trim().toUpperCase())) {
        errors.idProofNumber = rule.message;
      }
    }
    if (draft.alternatePhone.trim() && !/^\d{6,12}$/.test(draft.alternatePhone.trim())) {
      errors.alternatePhone = 'Enter a valid phone number.';
    }
    if (!draft.registeredAddressLine.trim()) {
      errors.registeredAddressLine = 'Enter the registered address.';
    }
    if (!draft.registeredTaluka.trim()) errors.registeredTaluka = 'Enter the taluka.';
    if (!draft.registeredDistrict.trim()) errors.registeredDistrict = 'Enter the district.';
    if (!PINCODE_PATTERN.test(draft.registeredPincode.trim())) {
      errors.registeredPincode = 'Enter a valid 6-digit PIN code.';
    }
  }

  if (step === 'EXCAVATION') {
   if (!draft.mineralId) errors.mineralId = 'Select a mineral.';
   if (draft.estimatedQuantity === null || draft.estimatedQuantity <= 0) {
     errors.estimatedQuantity = 'Enter an estimated quantity.';
   }
   if (!draft.excavationMethod) errors.excavationMethod = 'Select an excavation method.';
   if (!draft.purpose.trim()) errors.purpose = 'Describe the purpose.';
  }

  if (step === 'LOCATION') {
    if (!draft.districtCode) errors.districtCode = 'Select a district.';
    if (!draft.talukaCode) errors.talukaCode = 'Select a taluka.';
    if (!draft.villageCode) errors.villageCode = 'Select a village.';
    if (!draft.surveyNumber.trim()) errors.surveyNumber = 'Enter the survey number.';
    if (!draft.landType) errors.landType = 'Select the land type.';
    if (draft.areaInSqm === null || draft.areaInSqm <= 0) errors.areaInSqm = 'Enter the area.';
    if (!draft.addressLine.trim()) errors.addressLine = 'Enter the site address.';
    if (!PINCODE_PATTERN.test(draft.pincode.trim())) {
      errors.pincode = 'Enter a valid 6-digit PIN code.';
    }
    /* The pin is the point the department scrutinises; an application without
       one is an application to excavate somewhere in a taluka. */
    if (!draft.siteGeo) errors.siteGeo = 'Mark the excavation site on the map.';
  }

  if (step === 'DOCUMENTS') {
    if (missingRequiredDocuments(attachedDocuments).length > 0) {
      errors.documents = 'Attach every required document.';
    }
  }

  if (step === 'REVIEW') {
    if (!draft.declarationAccepted) {
      errors.declarationAccepted = 'Accept the declaration to continue.';
    }
  }

  return errors;
}

/* ---------------------------------------------------------------------------
 * FEES
 *
 * PROVISIONAL: every figure below is a placeholder. The real fee schedule and
 * royalty rates are set by the Revenue Department and must replace these
 * before production. They are isolated here so that replacing them is a
 * single-file change with no screen to touch.
 * ------------------------------------------------------------------------ */

/** Flat statutory fee payable before an application can be submitted. */
export const APPLICATION_FEE: Money = { amount: 1000, currency: 'INR' };

/** Per-tonne royalty used to compute a demand note. */
const ROYALTY_PER_TONNE = 400;
/** District Mineral Foundation contribution, as a share of royalty. */
const DMF_RATE = 0.1;
/** District cess, as a share of royalty. */
const DISTRICT_CESS_RATE = 0.02;

export function computeApplicationFee(): Money {
  return APPLICATION_FEE;
}

/**
 * Builds the demand note the department would raise for a given quantity.
 *
 * Modelled rather than invented wholesale: royalty plus DMF plus a district
 * cess is the common structure of a Maharashtra minor-mineral demand note. The
 * RATES are the placeholder part.
 */
export function computeDemandNoteBreakdown(quantity: Quantity): DemandNote['breakdown'] {
  const royalty = Math.round(quantity.value * ROYALTY_PER_TONNE);
  const dmf = Math.round(royalty * DMF_RATE);
  const cess = Math.round(royalty * DISTRICT_CESS_RATE);

  return [
    { label: 'Royalty', amount: { amount: royalty, currency: 'INR' } },
    { label: 'District Mineral Foundation', amount: { amount: dmf, currency: 'INR' } },
    { label: 'District cess', amount: { amount: cess, currency: 'INR' } },
  ];
}

export function totalOf(breakdown: DemandNote['breakdown']): Money {
  return {
    amount: breakdown.reduce((total, line) => total + line.amount.amount, 0),
    currency: 'INR',
  };
}

/** "₹2,68,800" — Indian digit grouping, no paise. */
export function formatMoney(money: Money): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: money.currency,
    maximumFractionDigits: 0,
  }).format(money.amount);
}

/* ---------------------------------------------------------------------------
 * LIFECYCLE
 * ------------------------------------------------------------------------ */

/**
 * A draft is submitted by PAYING, not by a separate submit action. Payment
 * success submits it automatically.
 */
export function awaitsApplicationFee(application: TemporaryExcavationApplication): boolean {
  return application.status === 'DRAFT';
}

/** The department has raised a demand note and is waiting for payment. */
export function awaitsDemandNotePayment(
  application: TemporaryExcavationApplication,
): boolean {
  return application.status === 'DEMAND_NOTE_ISSUED';
}

/** Is the applicant blocked on a payment right now? */
export function awaitsPayment(application: TemporaryExcavationApplication): boolean {
  return awaitsApplicationFee(application) || awaitsDemandNotePayment(application);
}

/** What the applicant owes right now, if anything. */
export function amountDue(application: TemporaryExcavationApplication): Money | null {
  if (awaitsApplicationFee(application)) return application.applicationFee;
  if (awaitsDemandNotePayment(application)) return application.demandNote?.totalAmount ?? null;
  return null;
}

/**
 * Is the department waiting on the applicant?
 *
 * The one status where the ball is in the organization's court, which is why
 * it is the only one that reaches Attention Required on the Home screen.
 */
export function needsApplicantResponse(
  application: TemporaryExcavationApplication,
): boolean {
  return application.status === 'QUERY_RAISED';
}

/** The workflow is finished — the order is in hand. */
export function hasExcavationOrder(
  application: TemporaryExcavationApplication,
): boolean {
  return application.status === 'ORDER_ISSUED';
}
