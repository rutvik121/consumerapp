import type {
  ApplicationDocumentKind,
  DemandNote,
  ExcavationMethod,
  GeoPoint,
  IdProofType,
  LandType,
  LocationCategory,
  Money,
  PlotLocationType,
  ProposalApplicationType,
  ProposalLevel,
  Quantity,
  SurveyEntry,
  TemporaryExcavationApplication,
} from '@/domain';

/**
 * TEMPORARY EXCAVATION — compliance workflow for organizations.
 *
 * Fully aligned with the desktop portal (mahakhanij.in/TemporaryProposal.aspx),
 * presented in a mobile-optimized 5-step stepper.
 */

/* ---------------------------------------------------------------------------
 * PROPOSAL & EXCAVATION CONSTANTS (Desktop Field Parity)
 * ------------------------------------------------------------------------ */

export const PROPOSAL_APPLICATION_TYPES: {
  value: ProposalApplicationType;
  label: string;
  description: string;
}[] = [
  {
    value: 'QUARRY_TEMPORARY_PLOT',
    label: 'Quarry - Temporary Plot Proposal',
    description: 'Commercial minor mineral extraction from temporary allocated plot',
  },
  {
    value: 'QUARRY_PROJECT_SELF_CONSUMPTION',
    label: 'Quarry For Project - Self Consumption',
    description: 'Material used strictly for project work / infrastructure development',
  },
];

export const PROPOSAL_LEVELS: { value: ProposalLevel; label: string }[] = [
  { value: 'DISTRICT_LEVEL', label: 'District Level (District Mining Officer)' },
  { value: 'SUB_DIVISIONAL_LEVEL', label: 'Sub-Divisional Level (SDO / Tehsildar)' },
  { value: 'STATE_LEVEL', label: 'State Level (Directorate of Geology & Mining)' },
];

export const LOCATION_CATEGORIES: { value: LocationCategory; label: string }[] = [
  { value: 'RURAL', label: 'Rural' },
  { value: 'URBAN', label: 'Urban' },
];

export const PLOT_LOCATIONS: { value: PlotLocationType; label: string }[] = [
  { value: 'INTERIOR', label: 'Interior' },
  { value: 'RIVERBED', label: 'Riverbed / Nalla' },
  { value: 'PLAIN_AGRICULTURAL', label: 'Plain / Agricultural Land' },
  { value: 'HILLY', label: 'Hilly / Slope Terrain' },
];

export const DEMAND_NOTE_OFFICES = [
  { value: 'DMO_PUNE', label: 'District Mining Office, Pune' },
  { value: 'DMO_AHILYANAGAR', label: 'District Mining Office, Ahilyanagar' },
  { value: 'DMO_NAGPUR', label: 'District Mining Office, Nagpur' },
  { value: 'DMO_THANE', label: 'District Mining Office, Thane' },
  { value: 'DMO_CHHATRAPATI_SAMBHAJINAGAR', label: 'District Mining Office, Chhatrapati Sambhajinagar' },
];

export const GRAS_OFFICES = [
  { value: 'GRAS_PUNE', label: 'Cyber Treasury Pune (GRAS MH)' },
  { value: 'GRAS_AHILYANAGAR', label: 'Treasury Office Ahilyanagar (GRAS MH)' },
  { value: 'GRAS_NAGPUR', label: 'Cyber Treasury Nagpur (GRAS MH)' },
  { value: 'GRAS_MUMBAI', label: 'Pay & Accounts Office Mumbai (GRAS MH)' },
];

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

/* ---------------------------------------------------------------------------
 * DOCUMENT DEFINITIONS & FREEDOM OF UPLOADING
 * ------------------------------------------------------------------------ */

export type DocumentCategory = 'IDENTITY_LAND' | 'NOC' | 'PERMISSION' | 'OTHER';

export interface DocumentDefinition {
  kind: ApplicationDocumentKind;
  category: DocumentCategory;
  label: string;
  importance: 'IMPORTANT' | 'OPTIONAL';
  requiresDocumentNumber?: boolean;
}

export const APPLICATION_DOCUMENT_DEFINITIONS: DocumentDefinition[] = [
  /* Core Land & Identity */
  { kind: 'PAN_CARD', category: 'IDENTITY_LAND', label: 'PAN Card Document', importance: 'IMPORTANT' },
  { kind: 'SEVEN_TWELVE', category: 'IDENTITY_LAND', label: '7/12 Extract (Satbara)', importance: 'IMPORTANT' },
  { kind: 'OWNER_APPROVAL', category: 'IDENTITY_LAND', label: 'Owner Approval / Affidavit', importance: 'IMPORTANT' },
  { kind: 'AADHAAR_CARD', category: 'IDENTITY_LAND', label: 'Aadhaar Card Document', importance: 'OPTIONAL' },
  { kind: 'GST_CERTIFICATE', category: 'IDENTITY_LAND', label: 'GST Registration Certificate', importance: 'OPTIONAL' },

  /* NOC Documents */
  { kind: 'NOC_PWD', category: 'NOC', label: 'Public Works Department (PWD)', importance: 'OPTIONAL', requiresDocumentNumber: true },
  { kind: 'NOC_MSEB', category: 'NOC', label: 'MSEB (Electricity Board)', importance: 'OPTIONAL', requiresDocumentNumber: true },
  { kind: 'NOC_MPCB', category: 'NOC', label: 'MPCB (Pollution Control)', importance: 'OPTIONAL', requiresDocumentNumber: true },
  { kind: 'NOC_FOREST', category: 'NOC', label: 'Forest Department', importance: 'OPTIONAL', requiresDocumentNumber: true },
  { kind: 'NOC_GRAM_PANCHAYAT', category: 'NOC', label: 'Gram Panchayat', importance: 'OPTIONAL', requiresDocumentNumber: true },

  /* Excavation Permission Documents */
  { kind: 'LAND_MUTATION', category: 'PERMISSION', label: 'Land Mutation (Ferfar)', importance: 'OPTIONAL' },
  { kind: 'IOD_CERTIFICATE', category: 'PERMISSION', label: 'IOD Certificate', importance: 'OPTIONAL' },
  { kind: 'LOI', category: 'PERMISSION', label: 'Letter of Intent (LOI)', importance: 'OPTIONAL' },
  { kind: 'IOD_APPROVED_BUILDING_PLAN', category: 'PERMISSION', label: 'IOD Approved Building Plan', importance: 'OPTIONAL' },
  { kind: 'EARTH_WORK_MEASUREMENT', category: 'PERMISSION', label: 'Measurement of Earth Work', importance: 'OPTIONAL' },
  { kind: 'BORE_LOG', category: 'PERMISSION', label: 'Bore Log Report', importance: 'OPTIONAL' },
  { kind: 'DP_REMARKS', category: 'PERMISSION', label: 'DP Remarks', importance: 'OPTIONAL' },

  /* Other */
  { kind: 'OTHER', category: 'OTHER', label: 'Other Supporting Documents', importance: 'OPTIONAL' },
];

export interface RequiredDocument {
  kind: ApplicationDocumentKind;
  required: boolean;
}

export const APPLICATION_DOCUMENTS: RequiredDocument[] = APPLICATION_DOCUMENT_DEFINITIONS.map(
  (doc) => ({
    kind: doc.kind,
    required: false, // Per user instruction: all non-mandatory at initial filing!
  }),
);

export function missingRequiredDocuments(
  _attached: readonly ApplicationDocumentKind[],
): ApplicationDocumentKind[] {
  // All documents non-mandatory at filing; user has freedom to proceed
  return [];
}

/* ---------------------------------------------------------------------------
 * THE APPLICATION DRAFT (Carries all desktop input fields)
 * ------------------------------------------------------------------------ */

export interface ApplicationDraft {
  /* 1 · Applicant */
  fullName: string;
  mobileNumber: string;
  landlineNumber: string;
  email: string;
  panNumber: string;
  aadhaarNumber: string;
  gstNumber: string;
  idProofType: IdProofType | '';
  idProofNumber: string;
  alternatePhone: string;
  registeredAddressLine: string;
  registeredTaluka: string;
  registeredDistrict: string;
  registeredPincode: string;

  /* 2 · Proposal & Excavation */
  applicationType: ProposalApplicationType;
  leaseType: 'TEMPORARY';
  proposalLevel: ProposalLevel;
  mineralId: string;
  excavationQuantityBrass: number | null;
  liftingPeriodDays: number | null;
  reasonForApplying: string;
  estimatedQuantity: number | null;
  excavationMethod: ExcavationMethod | '';
  depthInMetres: number | null;
  fromDate: string;
  toDate: string;
  purpose: string;
  remarks: string;

  /* 3 · Quarry and location */
  category: LocationCategory;
  plotLocationType: PlotLocationType;
  districtCode: string;
  districtName: string;
  talukaCode: string;
  talukaName: string;
  villageCode: string;
  villageName: string;
  surveyNumber: string;
  subDivisionNumber: string;
  surveyEntries: SurveyEntry[];
  totalPlotAreaHectare: number | null;
  landType: LandType | '';
  areaInSqm: number | null;
  addressLine: string;
  pincode: string;
  siteGeo: GeoPoint | null;
  demandNoteOffice: string;
  grasOfficeName: string;

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

const MOBILE_PATTERN = /^[6-9]\d{9}$/;
const PINCODE_PATTERN = /^[1-9]\d{5}$/;

/**
 * Field-level validation per step so errors surface where they are fixable.
 */
export function validateApplicationStep(
  step: ApplicationStep,
  draft: ApplicationDraft,
  _attachedDocuments: readonly ApplicationDocumentKind[] = [],
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (step === 'APPLICANT') {
    if (!draft.fullName.trim()) errors.fullName = 'Enter the applicant\u2019s full name.';
    if (!MOBILE_PATTERN.test(draft.mobileNumber.trim())) {
      errors.mobileNumber = 'Enter a valid 10-digit mobile number.';
    }
    if (draft.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      errors.email = 'Enter a valid email address.';
    }
    if (!draft.panNumber.trim()) {
      errors.panNumber = 'Enter the PAN number.';
    } else if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(draft.panNumber.trim().toUpperCase())) {
      errors.panNumber = 'PAN looks like ABCDE1234F.';
    }
    if (draft.aadhaarNumber.trim()) {
      const clean = draft.aadhaarNumber.replace(/\s/g, '');
      if (!/^\d{12}$/.test(clean)) {
        errors.aadhaarNumber = 'Aadhaar must be 12 digits.';
      }
    }
    if (
      draft.gstNumber.trim() &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
        draft.gstNumber.trim().toUpperCase(),
      )
    ) {
      errors.gstNumber = 'GST looks like 27AAAAA0000A1Z5.';
    }
    if (!draft.registeredAddressLine.trim()) {
      errors.registeredAddressLine = 'Enter the registered address.';
    }
    if (!draft.registeredDistrict.trim()) errors.registeredDistrict = 'Enter the district.';
    if (!PINCODE_PATTERN.test(draft.registeredPincode.trim())) {
      errors.registeredPincode = 'Enter a valid 6-digit PIN code.';
    }
  }

  if (step === 'EXCAVATION') {
    if (!draft.applicationType) errors.applicationType = 'Select an application type.';
    if (!draft.proposalLevel) errors.proposalLevel = 'Select a proposal level.';
    if (!draft.mineralId) errors.mineralId = 'Select a mineral.';
    if (draft.excavationQuantityBrass === null || draft.excavationQuantityBrass <= 0) {
      errors.excavationQuantityBrass = 'Enter excavation quantity in Brass.';
    }
    if (draft.liftingPeriodDays === null || draft.liftingPeriodDays <= 0) {
      errors.liftingPeriodDays = 'Enter lifting period in days.';
    }
    if (!draft.reasonForApplying.trim()) {
      errors.reasonForApplying = 'Enter reason for applying.';
    }
  }

  if (step === 'LOCATION') {
    if (!draft.category) errors.category = 'Select category (Rural/Urban).';
    if (!draft.plotLocationType) errors.plotLocationType = 'Select plot location.';
    if (!draft.districtCode) errors.districtCode = 'Select a district.';
    if (!draft.talukaCode) errors.talukaCode = 'Select a taluka.';
    if (!draft.villageCode) errors.villageCode = 'Select a village.';
    if (!draft.surveyNumber.trim() && draft.surveyEntries.length === 0) {
      errors.surveyNumber = 'Enter at least one survey number.';
    }
    if (draft.totalPlotAreaHectare === null || draft.totalPlotAreaHectare <= 0) {
      errors.totalPlotAreaHectare = 'Enter total plot area in hectares.';
    }
    if (!draft.siteGeo) {
      errors.siteGeo = 'Mark the excavation site coordinates or pick on map.';
    }
    if (!draft.demandNoteOffice) {
      errors.demandNoteOffice = 'Select office for demand note.';
    }
    if (!draft.grasOfficeName) {
      errors.grasOfficeName = 'Select GRAS office name.';
    }
  }

  if (step === 'DOCUMENTS') {
    // Non-mandatory per user instruction: documents are optional at filing!
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
