import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import type { Capability } from '@/rules';
import { userCan } from '@/rules';
import { useCurrentUser, useHasPendingVerification } from '@/state';
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
 * It only ever asks "is there a user?", which is why it survived the switch
 * from the prototype persona picker to real authentication unchanged.
 */
export function RequireSession({ children }: { children: ReactNode }) {
  const user = useCurrentUser();

  if (!user) {
    return <Navigate to={ROUTES.welcome} replace />;
  }

  return <>{children}</>;
}

/**
 * Keeps an authenticated user out of the authentication screens.
 *
 * Without this, a signed-in user following an old link to /login would be
 * offered a sign-in form for an account they are already inside.
 */
export function RequireNoSession({ children }: { children: ReactNode }) {
  const user = useCurrentUser();

  if (user) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return <>{children}</>;
}

/**
 * Guards the OTP screen.
 *
 * The auth flow store is deliberately not persisted, so refreshing on /verify
 * leaves nothing to verify. Rather than render an empty screen, send the user
 * back to the start — which is also what real authentication does when a
 * verification session expires.
 */
export function RequirePendingVerification({ children }: { children: ReactNode }) {
  const hasPending = useHasPendingVerification();

  if (!hasPending) {
    return <Navigate to={ROUTES.login} replace />;
  }

  return <>{children}</>;
}
