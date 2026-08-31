import type { TemporaryExcavationApplication } from '@/domain';

/**
 * TEMPORARY EXCAVATION — the one compliance workflow in scope, and the one
 * feature that is ORGANIZATION-ONLY.
 *
 * WHAT THIS APP OWNS, AND WHAT IT DOES NOT.
 *
 * The Consumer App can prepare and submit an application. Everything after
 * submission — review, queries, approval, rejection — is the department's, and
 * arrives here as status. That boundary is why the only transition this app
 * performs is DRAFT → SUBMITTED, and why there is no "approve" or "respond to
 * query" action anywhere: inventing one would put a decision in the applicant's
 * hands that is not theirs to make.
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

/** Only a draft can be submitted by the applicant. */
export function canSubmitApplication(application: TemporaryExcavationApplication): boolean {
  return application.status === 'DRAFT';
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
