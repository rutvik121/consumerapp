import type {
  DemandNote,
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
 * PROVISIONAL (open question #5): the real application field list is
 * unconfirmed. What is modelled here is a reasonable excavation-permit shape —
 * survey number, area, depth, mineral, quantity, purpose, period, documents.
 * Confirm it before this reaches production.
 */

export interface ApplicationDraft {
  mineralId: string;
  estimatedQuantity: number | null;
  purpose: string;
  surveyNumber: string;
  addressLine: string;
  taluka: string;
  district: string;
  pincode: string;
  areaInSqm: number | null;
  depthInMetres: number | null;
  fromDate: string;
  toDate: string;
}

export type ApplicationStep = 'SITE' | 'EXCAVATION' | 'PERIOD';

export const APPLICATION_STEPS: ApplicationStep[] = ['SITE', 'EXCAVATION', 'PERIOD'];

/** Field-level validation, per step, so errors surface where they are fixable. */
export function validateApplicationStep(
  step: ApplicationStep,
  draft: ApplicationDraft,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (step === 'SITE') {
    if (!draft.surveyNumber.trim()) errors.surveyNumber = 'Enter the survey number.';
    if (!draft.addressLine.trim()) errors.addressLine = 'Enter the site address.';
    if (!draft.taluka.trim()) errors.taluka = 'Enter the taluka.';
    if (!draft.district.trim()) errors.district = 'Enter the district.';
    if (!/^[1-9]\d{5}$/.test(draft.pincode.trim())) errors.pincode = 'Enter a valid 6-digit PIN code.';
  }

  if (step === 'EXCAVATION') {
    if (!draft.mineralId) errors.mineralId = 'Select a mineral.';
    if (draft.estimatedQuantity === null || draft.estimatedQuantity <= 0) {
      errors.estimatedQuantity = 'Enter an estimated quantity.';
    }
    if (draft.areaInSqm === null || draft.areaInSqm <= 0) errors.areaInSqm = 'Enter the area.';
    if (draft.depthInMetres === null || draft.depthInMetres <= 0) {
      errors.depthInMetres = 'Enter the depth.';
    }
    if (!draft.purpose.trim()) errors.purpose = 'Describe the purpose.';
  }

  if (step === 'PERIOD') {
    if (!draft.fromDate) errors.fromDate = 'Select a start date.';
    if (!draft.toDate) errors.toDate = 'Select an end date.';
    if (draft.fromDate && draft.toDate && draft.toDate < draft.fromDate) {
      errors.toDate = 'The end date cannot be before the start date.';
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
