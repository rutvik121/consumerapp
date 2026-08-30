import type { NormalConsumerUser, Organization, OrganizationUser, User } from '@/domain';
import type { RegistrationDraft } from '@/rules';
import { PROTOTYPE_OTP, isValidOtp, normalizeMobile } from '@/rules';
import { request } from '../client';
import { db } from '../db';

/**
 * AUTHENTICATION — the mock backend.
 *
 * Mirrors what a real Mahakhanij auth endpoint would expose, so replacing the
 * bodies with `fetch()` needs no change at any call site.
 *
 * The seeded personas are reachable by their real fixture mobile numbers:
 *   9822014576 → Rohit Sanghavi   (Organization)
 *   9730845120 → Aniket Deshmukh  (Normal Consumer)
 *
 * Signing in with either lands in an account that already owns projects,
 * orders, deliveries and inventory — so authentication connects to the same
 * dataset the rest of the app uses, rather than dropping you into an empty
 * shell.
 */

export interface RequestOtpResult {
  /** Whether an account already exists for this number. */
  accountExists: boolean;
}

export type VerifyOtpResult =
  | { status: 'SIGNED_IN'; user: User; organization: Organization | null }
  | { status: 'NO_ACCOUNT' }
  | { status: 'INVALID_OTP' };

export const authRepository = {
  /**
   * Sends a verification code. In production this hits an SMS gateway; here it
   * only reports whether the number is known, which the OTP screen uses to
   * tell "wrong code" apart from "no account".
   */
  requestOtp: (mobileNumber: string): Promise<RequestOtpResult> =>
    request(() => {
      const normalized = normalizeMobile(mobileNumber);
      return {
        accountExists: db.users.some((user) => user.mobileNumber === normalized),
      };
    }),

  /** Verifies a code for an EXISTING account and resolves the session. */
  verifyOtp: (mobileNumber: string, otp: string): Promise<VerifyOtpResult> =>
    request(() => {
      if (!isValidOtp(otp) || otp !== PROTOTYPE_OTP) {
        return { status: 'INVALID_OTP' } as const;
      }

      const normalized = normalizeMobile(mobileNumber);
      const user = db.users.find((candidate) => candidate.mobileNumber === normalized);
      if (!user) return { status: 'NO_ACCOUNT' } as const;

      const organization =
        user.userType === 'ORGANIZATION'
          ? (db.organizations.find((org) => org.id === user.organizationId) ?? null)
          : null;

      return { status: 'SIGNED_IN', user, organization } as const;
    }),

  /**
   * Verifies a code and creates the account.
   *
   * Registration is what establishes the user type, and therefore the entire
   * post-login experience. An ORGANIZATION registration also creates the
   * Organization record the user belongs to.
   */
  registerAndVerify: (
    draft: RegistrationDraft,
    otp: string,
  ): Promise<VerifyOtpResult | { status: 'ALREADY_REGISTERED' }> =>
    request(() => {
      if (!isValidOtp(otp) || otp !== PROTOTYPE_OTP) {
        return { status: 'INVALID_OTP' } as const;
      }

      const normalized = normalizeMobile(draft.mobileNumber);
      if (db.users.some((user) => user.mobileNumber === normalized)) {
        return { status: 'ALREADY_REGISTERED' } as const;
      }

      const createdAt = new Date().toISOString();

      if (draft.userType === 'ORGANIZATION') {
        const details = draft.organization;
        if (!details) return { status: 'INVALID_OTP' } as const;

        const organization: Organization = {
          id: `org-${nextSequence('org')}`,
          name: details.organizationName.trim(),
          // Metadata only. It is displayed, and it branches nothing.
          type: details.organizationType,
          registrationNumber: details.registrationNumber.trim(),
          address: {
            line1: '—',
            taluka: '—',
            district: '—',
            state: 'Maharashtra',
            pincode: '—',
          },
          primaryContact: { name: draft.fullName.trim(), mobileNumber: normalized },
        };

        const user: OrganizationUser = {
          id: `user-org-${nextSequence('user')}`,
          userType: 'ORGANIZATION',
          fullName: draft.fullName.trim(),
          mobileNumber: normalized,
          organizationId: organization.id,
          createdAt,
        };

        db.organizations.push(organization);
        db.users.push(user);
        return { status: 'SIGNED_IN', user, organization } as const;
      }

      const delivery = draft.delivery;
      if (!delivery) return { status: 'INVALID_OTP' } as const;

      const user: NormalConsumerUser = {
        id: `user-con-${nextSequence('user')}`,
        userType: 'NORMAL_CONSUMER',
        fullName: draft.fullName.trim(),
        mobileNumber: normalized,
        createdAt,
        deliveryAddress: {
          line1: delivery.addressLine.trim(),
          taluka: delivery.taluka.trim(),
          district: delivery.district.trim(),
          state: 'Maharashtra',
          pincode: delivery.pincode.trim(),
        },
        /**
         * PROVISIONAL: a real implementation geocodes the address. The
         * prototype centres new consumers on Nashik so stock point distances
         * remain plausible.
         */
        deliveryGeo: { latitude: 19.9975, longitude: 73.7898 },
      };

      db.users.push(user);
      return { status: 'SIGNED_IN', user, organization: null } as const;
    }),
};

/** Monotonic ids for records created during a session. */
function nextSequence(kind: 'org' | 'user'): string {
  const count = kind === 'org' ? db.organizations.length : db.users.length;
  return String(count + 1).padStart(3, '0');
}
