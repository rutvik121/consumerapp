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

/** Aadhaar: exactly 12 numeric digits */
const AADHAAR_PATTERN = /^\d{12}$/;

/** PAN: 5 uppercase letters, 4 digits, 1 uppercase letter */
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export function normalizeAadhaar(input: string): string {
  return input.replace(/[\s-]/g, '');
}

export function isValidAadhaar(input: string): boolean {
  return AADHAAR_PATTERN.test(normalizeAadhaar(input));
}

/** Formats 12 digits as "1234 5678 9012" */
export function formatAadhaar(input: string): string {
  const digits = normalizeAadhaar(input).slice(0, 12);
  const parts = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(' ');
}

export function normalizePan(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase();
}

export function isValidPan(input: string): boolean {
  return PAN_PATTERN.test(normalizePan(input));
}

export interface OrganizationRegistrationDetails {
  organizationName: string;
  organizationType: 'BUILDER' | 'CONTRACTOR' | 'GOVERNMENT' | 'OTHER';
  registrationNumber?: string;
}

export interface AddressRegistrationDetails {
  addressLine: string;
  taluka: string;
  district: string;
  pincode: string;
}

export type ConsumerRegistrationDetails = AddressRegistrationDetails;

export interface KycDetails {
  documentKind: 'AADHAAR' | 'PAN';
  documentNumber: string;
  fileName: string;
  fileSize?: number;
  fileUrl?: string;
}

export interface RegistrationDraft {
  userType: UserType;
  fullName: string;
  mobileNumber: string;
  address: AddressRegistrationDetails;
  organization?: OrganizationRegistrationDetails;
  delivery?: ConsumerRegistrationDetails;
  kyc: KycDetails;
}

export function isValidPincode(input: string): boolean {
  return /^[1-9]\d{5}$/.test(input.trim());
}

/**
 * Step 1: Personal / Org details & Address
 * Step 2: KYC Verification (Aadhaar upload for Individual, PAN upload for Organization)
 * Followed by OTP Verification on the verify screen.
 */
export function registrationStepCount(): number {
  return 2;
}

/** Is the draft complete enough to submit for verification? */
export function isRegistrationComplete(draft: Partial<RegistrationDraft>): boolean {
  if (!draft.userType || !draft.fullName?.trim()) return false;
  if (!draft.mobileNumber || !isValidMobile(draft.mobileNumber)) return false;

  const address = draft.address ?? draft.delivery;
  if (
    !address?.addressLine.trim() ||
    !address.taluka.trim() ||
    !address.district.trim() ||
    !isValidPincode(address.pincode)
  ) {
    return false;
  }

  if (draft.userType === 'ORGANIZATION') {
    const organization = draft.organization;
    if (!organization?.organizationName.trim() || !organization.organizationType) {
      return false;
    }
  }

  const kyc = draft.kyc;
  if (!kyc || !kyc.fileName.trim()) return false;

  if (draft.userType === 'NORMAL_CONSUMER') {
    return kyc.documentKind === 'AADHAAR' && isValidAadhaar(kyc.documentNumber);
  }

  return kyc.documentKind === 'PAN' && isValidPan(kyc.documentNumber);
}
