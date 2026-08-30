import type { ID, Quantity, UserType } from '@/domain';

/**
 * MINERAL ENQUIRY rules.
 *
 * TERMINOLOGY: this is an Enquiry. Never "Book Mineral", never "Add to cart",
 * never "Place order". The user is stating a requirement to a source, not
 * completing a purchase. Language is most of what keeps this from feeling like
 * a marketplace.
 */

/**
 * The organization fields an enquiry carries.
 *
 * THE SINGLE POINT WHERE CONTEXT BECOMES DATA. Every enquiry is built through
 * here, so a Normal Consumer cannot acquire organization fields even by
 * mistake — for them these keys are absent, not empty.
 */
export interface EnquiryScopeFields {
  organizationId?: ID;
  projectId?: ID;
  packageId?: ID;
}

export function enquiryScopeFor(context: {
  userType: UserType;
  organizationId?: ID;
  projectId?: ID;
  packageId?: ID;
}): EnquiryScopeFields {
  if (context.userType !== 'ORGANIZATION') return {};

  return {
    ...(context.organizationId ? { organizationId: context.organizationId } : {}),
    ...(context.projectId ? { projectId: context.projectId } : {}),
    ...(context.packageId ? { packageId: context.packageId } : {}),
  };
}

export interface EnquiryDraft {
  mineralId: ID | null;
  requiredQuantity: number | null;
  requiredByDate: string;
  remarks: string;
}

export interface EnquiryValidation {
  valid: boolean;
  errors: { mineralId?: string; requiredQuantity?: string };
  /**
   * Non-blocking. Requesting more than a stock point currently holds is
   * allowed — stock is replenished, and an enquiry is a question, not a
   * commitment. The user is told, not stopped.
   *
   * ASSUMPTION: no confirmed rule exists for over-availability requests.
   */
  warning?: string;
}

export function validateEnquiry(
  draft: EnquiryDraft,
  available: Quantity | null,
): EnquiryValidation {
  const errors: EnquiryValidation['errors'] = {};

  if (!draft.mineralId) errors.mineralId = 'Select a mineral.';

  if (draft.requiredQuantity === null || draft.requiredQuantity <= 0) {
    errors.requiredQuantity = 'Enter a quantity greater than zero.';
  }

  const valid = Object.keys(errors).length === 0;

  if (
    valid &&
    available &&
    draft.requiredQuantity !== null &&
    draft.requiredQuantity > available.value
  ) {
    return {
      valid,
      errors,
      warning: `This stock point currently holds ${available.value} ${available.unit}. You can still enquire for more.`,
    };
  }

  return { valid, errors };
}
