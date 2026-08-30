/**
 * NAVIGATION LAYER
 *
 *   routes.ts           every path, defined once
 *   tabs.ts             role-driven bottom navigation configuration
 *   RoleGuard.tsx       route-level capability and session enforcement
 *   AppShell.tsx        the mobile shell: device frame, nav, overlay root
 *   Screen.tsx          standard screen frame used by every screen
 */
export { ROUTES } from './routes';
export { TABS_BY_USER_TYPE, tabsFor, type TabItem } from './tabs';
export { BottomNavigation } from './BottomNavigation';
export {
  RoleGuard,
  RequireSession,
  RequireNoSession,
  RequirePendingVerification,
} from './RoleGuard';
export { AppShell } from './AppShell';
export { Screen, type ScreenProps } from './Screen';
export { OrganizationContextBar } from './OrganizationContextBar';
