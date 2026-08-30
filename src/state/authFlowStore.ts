import { create } from 'zustand';
import type { AuthIntent, RegistrationDraft } from '@/rules';

/**
 * AUTH FLOW — the data that travels between authentication screens.
 *
 *     Login    → mobile number ──┐
 *                                ├→ OTP screen → session
 *     Register → draft ──────────┘
 *
 * DELIBERATELY NOT PERSISTED. An in-progress verification should not survive a
 * page refresh — that is how real authentication behaves, and it means a
 * reloaded OTP screen has no number to verify and correctly sends the user
 * back to the start. The route guard `RequirePendingVerification` enforces it.
 *
 * This store is emptied the moment a session exists. It holds nothing after
 * sign-in.
 */
interface AuthFlowState {
  intent: AuthIntent | null;
  /** The number awaiting verification. Normalized to 10 digits. */
  mobileNumber: string | null;
  /** Only present when intent is REGISTER. */
  registrationDraft: RegistrationDraft | null;

  startSignIn: (mobileNumber: string) => void;
  startRegistration: (draft: RegistrationDraft) => void;
  reset: () => void;
}

export const useAuthFlowStore = create<AuthFlowState>()((set) => ({
  intent: null,
  mobileNumber: null,
  registrationDraft: null,

  startSignIn: (mobileNumber) =>
    set({ intent: 'SIGN_IN', mobileNumber, registrationDraft: null }),

  startRegistration: (draft) =>
    set({
      intent: 'REGISTER',
      mobileNumber: draft.mobileNumber,
      registrationDraft: draft,
    }),

  reset: () => set({ intent: null, mobileNumber: null, registrationDraft: null }),
}));

/** True when a verification is genuinely in progress. */
export const useHasPendingVerification = (): boolean =>
  useAuthFlowStore((state) => state.mobileNumber !== null && state.intent !== null);
