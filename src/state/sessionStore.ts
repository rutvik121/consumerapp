import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Organization, User, UserType } from '@/domain';

/**
 * SESSION — who is signed in, and therefore which application they see.
 *
 * `user.userType` is the root of every role decision in the app. Nothing
 * derives role from anywhere else.
 *
 * Persisted to localStorage so a page refresh does not eject the user
 * mid-demo. Increment 1 replaces `signIn` with real OTP authentication; the
 * store's shape does not need to change when it does.
 */

export type SessionStatus = 'UNAUTHENTICATED' | 'AUTHENTICATED';

interface SessionState {
  status: SessionStatus;
  user: User | null;
  /** Resolved for ORGANIZATION users only. Always null for consumers. */
  organization: Organization | null;

  signIn: (user: User, organization?: Organization | null) => void;
  signOut: () => void;
  updateUser: (partial: Partial<User>) => void;
  updateOrganization: (partial: Partial<Organization>) => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      status: 'UNAUTHENTICATED',
      user: null,
      organization: null,

      signIn: (user, organization = null) =>
        set({
          status: 'AUTHENTICATED',
          user,
          organization: user.userType === 'ORGANIZATION' ? organization : null,
        }),

      signOut: () => set({ status: 'UNAUTHENTICATED', user: null, organization: null }),

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? ({ ...state.user, ...partial } as User) : null,
        })),

      updateOrganization: (partial) =>
        set((state) => ({
          organization: state.organization ? ({ ...state.organization, ...partial } as Organization) : null,
        })),
    }),
    { name: 'mahakhanij.session' },
  ),
);

/* --- Selectors. Prefer these over reaching into the store shape. --- */

export const useCurrentUser = (): User | null => useSessionStore((state) => state.user);

export const useUserType = (): UserType | null =>
  useSessionStore((state) => state.user?.userType ?? null);

export const useIsAuthenticated = (): boolean =>
  useSessionStore((state) => state.status === 'AUTHENTICATED' && state.user !== null);

export const useCurrentOrganization = (): Organization | null =>
  useSessionStore((state) => state.organization);
