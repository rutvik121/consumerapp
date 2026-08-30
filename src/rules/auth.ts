import type { UserType } from '@/domain';

/**
 * AUTHENTICATION RULES.
 *
 * Conceptual flow from the Project Context:
 *
 *     Splash → Login / Register → Mobile Number → OTP Verification
 *           → Authenticated Experience
 *
 * Registration is what establishes the user type, and the user type is what
 * determines the entire post-login experience. That single choice is the most
 * consequential input in the product, which is why it is step one of
 * registration rather than a field buried in a form.
 */

/** Indian mobile numbers are 10 digits and begin 6–9. */
const MOBILE_PATTERN = /^[6-9]\d{9}$/;

export const MOBILE_LENGTH = 10;
export const OTP_LENGTH = 6;

/** Seconds before the code can be requested again. */
export const OTP_RESEND_SECONDS = 30;

/**
 * PROTOTYPE ONLY — the code the mock backend accepts.
 *
 * Any other 6-digit code is rejected, so the error state is real and
 * reviewable rather than a screen nobody ever sees. Replaced by a genuine
 * SMS gateway in production.
 */
export const PROTOTYPE_OTP = '123456';

/** Strips spaces, dashes and a leading +91 or 0. */
export function normalizeMobile(input: string): string {
  return input.replace(/[\s-]/g, '').replace(/^(\+91|91|0)/, '');
}

export function isValidMobile(input: string): boolean {
  return MOBILE_PATTERN.test(normalizeMobile(input));
}

export function isValidOtp(input: string): boolean {
  return new RegExp(`^\\d{${OTP_LENGTH}}$`).test(input);
}

/** "98220 14576" — grouped the way Indian numbers are read aloud. */
export function formatMobile(input: string): string {
  const digits = normalizeMobile(input);
  if (digits.length !== MOBILE_LENGTH) return digits;
  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
}

/** "+91 98220 14576" */
export function formatMobileWithCode(input: string): string {
  return `+91 ${formatMobile(input)}`;
}

/**
 * What the user is trying to do. The OTP screen serves both, because
 * verifying a mobile number is the same step either way — only what happens
 * after verification differs.
 */
export type AuthIntent = 'SIGN_IN' | 'REGISTER';

/**
 * Registration collects different things per user type, so the form asks for
 * the type FIRST and only then asks what that type actually needs. Asking
 * every question to everyone would be the long, overwhelming form the UX
 * principles rule out.
 */
export interface OrganizationRegistrationDetails {
  organizationName: string;
  organizationType: 'BUILDER' | 'CONTRACTOR' | 'GOVERNMENT' | 'OTHER';
  registrationNumber: string;
}

/**
 * PROVISIONAL (open question #8): a Normal Consumer needs a delivery
 * destination for the same reason an Organization has a Package site — stock
 * point distance is measured to it, and receiving verifies the e-TP
 * destination against it. The real field list is unconfirmed.
 */
export interface ConsumerRegistrationDetails {
  addressLine: string;
  taluka: string;
  district: string;
  pincode: string;
}

export interface RegistrationDraft {
  userType: UserType;
  fullName: string;
  mobileNumber: string;
  organization?: OrganizationRegistrationDetails;
  delivery?: ConsumerRegistrationDetails;
}

export function isValidPincode(input: string): boolean {
  return /^[1-9]\d{5}$/.test(input.trim());
}

/**
 * Which registration steps apply to a given user type.
 * Step 1 is always the user-type choice; step 3 differs by type.
 */
export function registrationStepCount(): number {
  return 3;
}

/** Is the draft complete enough to submit for verification? */
export function isRegistrationComplete(draft: Partial<RegistrationDraft>): boolean {
  if (!draft.userType || !draft.fullName?.trim()) return false;
  if (!draft.mobileNumber || !isValidMobile(draft.mobileNumber)) return false;

  if (draft.userType === 'ORGANIZATION') {
    const organization = draft.organization;
    return Boolean(
      organization?.organizationName.trim() &&
        organization.organizationType &&
        organization.registrationNumber.trim(),
    );
  }

  const delivery = draft.delivery;
  return Boolean(
    delivery?.addressLine.trim() &&
      delivery.taluka.trim() &&
      delivery.district.trim() &&
      isValidPincode(delivery.pincode),
  );
}
