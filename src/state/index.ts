/**
 * APPLICATION STATE
 *
 * Two stores only, both deliberately small:
 *
 *   sessionStore              who is signed in → drives all role decisions
 *   organizationContextStore  which Project/Package they are operating inside
 *
 * plus one derived hook:
 *
 *   useOperatingContext()     the resolved context that travels into flows
 *
 * Screen-local state (form values, open sheets, selected tabs) stays in the
 * screen with useState. It does not belong here. Operational data lives in the
 * data layer and is fetched through repositories, not mirrored into a store.
 */
export {
  useSessionStore,
  useCurrentUser,
  useUserType,
  useIsAuthenticated,
  useCurrentOrganization,
  type SessionStatus,
} from './sessionStore';

export {
  useOrganizationContextStore,
  useActiveProject,
  useActivePackage,
} from './organizationContextStore';

export { useOperatingContext, type OperatingContext } from './useOperatingContext';
