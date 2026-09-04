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
  importance: 'MANDATORY' | 'OPTIONAL';
  requiresDocumentNumber?: boolean;
}

export const APPLICATION_DOCUMENT_DEFINITIONS: DocumentDefinition[] = [
  /* Core Land & Identity */
  { kind: 'PAN_CARD', category: 'IDENTITY_LAND', label: 'PAN Card Document', importance: 'MANDATORY' },
  { kind: 'SEVEN_TWELVE', category: 'IDENTITY_LAND', label: '7/12 Extract (Satbara)', importance: 'MANDATORY' },
  { kind: 'OWNER_APPROVAL', category: 'IDENTITY_LAND', label: 'Owner Approval / Affidavit', importance: 'MANDATORY' },
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

export const MANDATORY_DOCUMENTS: ApplicationDocumentKind[] = [
  'PAN_CARD',
  'SEVEN_TWELVE',
  'OWNER_APPROVAL',
];

export interface RequiredDocument {
  kind: ApplicationDocumentKind;
  required: boolean;
}

export const APPLICATION_DOCUMENTS: RequiredDocument[] = APPLICATION_DOCUMENT_DEFINITIONS.map(
  (doc) => ({
    kind: doc.kind,
    required: doc.importance === 'MANDATORY',
  }),
);

export function missingRequiredDocuments(
  attached: readonly ApplicationDocumentKind[],
): ApplicationDocumentKind[] {
  return MANDATORY_DOCUMENTS.filter((kind) => !attached.includes(kind));
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

  /* Project Details (Conditional on QUARRY_PROJECT_SELF_CONSUMPTION) */
  totalExcavationQuantityBrass: number | null;
  projectType: 'GOVERNMENT' | 'PRIVATE';
  departmentName: string;
  officeName: string;
  workOrderNumber: string;
  workOrderDocumentName?: string;
  projectCode: string;
  projectName: string;
  projectAddress: string;
  projectLatitude: string;
  projectLongitude: string;
  zeroRoyaltyScheme: 'NO' | 'YES';

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
  attachedDocuments: readonly ApplicationDocumentKind[] = [],
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

    if (draft.applicationType === 'QUARRY_PROJECT_SELF_CONSUMPTION') {
      if (draft.totalExcavationQuantityBrass === null || draft.totalExcavationQuantityBrass <= 0) {
        errors.totalExcavationQuantityBrass = 'Enter total excavation quantity in Brass.';
      }
      if (draft.projectType !== 'PRIVATE') {
        if (!draft.departmentName?.trim()) errors.departmentName = 'Enter department name.';
        if (!draft.officeName?.trim()) errors.officeName = 'Enter office name.';
      }
      if (!draft.projectCode?.trim()) errors.projectCode = 'Enter project code.';
      if (!draft.projectName?.trim()) errors.projectName = 'Enter project name.';
      if (!draft.projectAddress?.trim()) errors.projectAddress = 'Enter project address.';
      if (!draft.projectLatitude?.trim()) errors.projectLatitude = 'Enter project latitude.';
      if (!draft.projectLongitude?.trim()) errors.projectLongitude = 'Enter project longitude.';
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
    const missing = missingRequiredDocuments(attachedDocuments);
    if (missing.length > 0) {
      const missingLabels = APPLICATION_DOCUMENT_DEFINITIONS
        .filter((d) => missing.includes(d.kind))
        .map((d) => d.label)
        .join(', ');
      errors.documents = `Please upload all mandatory documents (*): ${missingLabels}`;
    }
  }

  if (step === 'REVIEW') {
    const missing = missingRequiredDocuments(attachedDocuments);
    if (missing.length > 0) {
      errors.documents = 'Upload all mandatory documents (*) before submitting.';
    }
    if (!draft.declarationAccepted) {
      errors.declarationAccepted = 'Accept the declaration to continue.';
    }
  }

  return errors;
}

/* ---------------------------------------------------------------------------
 * FEES
 *
 * Tiered Application Fee Formula:
 * - 1 – 500 Brass: Application Fee ₹500 + Stamp Duty ₹20 (Total ₹520)
 * - 501 – 2,000 Brass: Application Fee ₹2,000 + Stamp Duty ₹20 (Total ₹2,020)
 * - 2,000+ Brass: Application Fee ₹5,000 + Stamp Duty ₹20 (Total ₹5,020)
 * ------------------------------------------------------------------------ */

export interface ApplicationFeeBreakdown {
  quantityBrass: number;
  slabLabel: string;
  slabRange: string;
  baseFee: Money;
  stampDuty: Money;
  totalFee: Money;
}

export const STAMP_DUTY_FEE: Money = { amount: 20, currency: 'INR' };

export function calculateApplicationFeeBreakdown(quantityBrass: number = 0): ApplicationFeeBreakdown {
  const qty = Math.max(0, Number(quantityBrass) || 0);
  let baseAmount = 500;
  let slabLabel = '1 – 500 Brass';
  let slabRange = '1 – 500 Brass';

  if (qty > 2000) {
    baseAmount = 5000;
    slabLabel = '2,001+ Brass';
    slabRange = '2,001+ Brass';
  } else if (qty > 500) {
    baseAmount = 2000;
    slabLabel = '501 – 2,000 Brass';
    slabRange = '501 – 2,000 Brass';
  } else {
    baseAmount = 500;
    slabLabel = '1 – 500 Brass';
    slabRange = '1 – 500 Brass';
  }

  const stampDutyAmount = 20;

  return {
    quantityBrass: qty,
    slabLabel,
    slabRange,
    baseFee: { amount: baseAmount, currency: 'INR' },
    stampDuty: { amount: stampDutyAmount, currency: 'INR' },
    totalFee: { amount: baseAmount + stampDutyAmount, currency: 'INR' },
  };
}

export function computeApplicationFee(quantityBrass: number = 100): Money {
  return calculateApplicationFeeBreakdown(quantityBrass).totalFee;
}

export interface DemandNoteChannelBreakdown {
  gras: {
    head: string;
    amount: Money;
    total: Money;
  };
  mahakhanij: {
    dmf: Money;
    siCharges: Money;
    siTax: Money;
    tcs: Money;
    total: Money;
  };
  grandTotal: Money;
}

export function computeDetailedDemandNoteBreakdown(quantity: Quantity): DemandNoteChannelBreakdown {
  const qty = quantity?.value || 10;
  const royaltyAmount = Math.max(2200, Math.round(qty * 400));
  const dmfAmount = Math.round(royaltyAmount * 0.10);
  const siChargesAmount = Math.max(100, Math.round(qty * 25));
  const siTaxAmount = Math.round(siChargesAmount * 0.18);
  const tcsAmount = Math.round(royaltyAmount * 0.02);

  const grasTotal = royaltyAmount;
  const mahakhanijTotal = dmfAmount + siChargesAmount + siTaxAmount + tcsAmount;

  return {
    gras: {
      head: 'Fees and Royalties',
      amount: { amount: royaltyAmount, currency: 'INR' },
      total: { amount: grasTotal, currency: 'INR' },
    },
    mahakhanij: {
      dmf: { amount: dmfAmount, currency: 'INR' },
      siCharges: { amount: siChargesAmount, currency: 'INR' },
      siTax: { amount: siTaxAmount, currency: 'INR' },
      tcs: { amount: tcsAmount, currency: 'INR' },
      total: { amount: mahakhanijTotal, currency: 'INR' },
    },
    grandTotal: { amount: grasTotal + mahakhanijTotal, currency: 'INR' },
  };
}

/**
 * Builds the demand note the department would raise for a given quantity.
 *
 * Modelled rather than invented wholesale: royalty plus DMF plus a district
 * cess is the common structure of a Maharashtra minor-mineral demand note.
 */
export function computeDemandNoteBreakdown(quantity: Quantity): DemandNote['breakdown'] {
  const detailed = computeDetailedDemandNoteBreakdown(quantity);

  return [
    { label: 'Fees & Royalty (GRAS Part A)', amount: detailed.gras.amount },
    { label: 'District Mineral Foundation (DMF)', amount: detailed.mahakhanij.dmf },
    { label: 'Supervision & Inspection (SI Charges)', amount: detailed.mahakhanij.siCharges },
    { label: 'SI Tax (18% GST)', amount: detailed.mahakhanij.siTax },
    { label: 'District TCS', amount: detailed.mahakhanij.tcs },
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
