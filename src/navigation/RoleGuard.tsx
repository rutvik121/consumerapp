import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import type { Capability } from '@/rules';
import { userCan } from '@/rules';
import { useCurrentUser } from '@/state';
import { ROUTES } from './routes';

/**
 * ROUTE-LEVEL ACCESS CONTROL.
 *
 * Hiding a feature from navigation is presentation, not protection. This guard
 * is the protection: a Normal Consumer who types /temporary-excavation
 * directly is redirected Home.
 *
 * WHY REDIRECT RATHER THAN SHOW "NOT AVAILABLE":
 *   The product rule is that Normal Consumers must NEVER see Temporary
 *   Excavation — not on Home, not in navigation, not in More, not anywhere. An
 *   explicit "this feature is not available to you" screen would still reveal
 *   the feature exists. A silent redirect reveals nothing, which is what the
 *   rule actually requires.
 *
 * The capability itself is never defined here — it comes from the single
 * matrix in @/rules/access, the same one navigation reads.
 */
export function RoleGuard({
  capability,
  children,
}: {
  capability: Capability;
  children: ReactNode;
}) {
  const user = useCurrentUser();

  if (!userCan(user, capability)) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return <>{children}</>;
}

/**
 * Gate for the whole authenticated application. Anyone without a session is
 * sent to the entry point.
 *
 * Increment 1 replaces the persona picker with real authentication; this guard
 * keeps working unchanged because it only asks "is there a user?".
 */
export function RequireSession({ children }: { children: ReactNode }) {
  const user = useCurrentUser();

  if (!user) {
    return <Navigate to={ROUTES.personaPicker} replace />;
  }

  return <>{children}</>;
}
