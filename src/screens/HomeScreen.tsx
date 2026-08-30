import { useCurrentUser } from '@/state';
import { OrganizationHomeScreen } from './organization';
import { ConsumerHomeScreen } from './consumer/ConsumerHomeScreen';

/**
 * Home resolves by role — ONE route, two experiences.
 *
 * This is the structural expression of "one application, two authenticated
 * experiences". There is no separate organization app and no duplicated route;
 * the authenticated user's type decides which experience renders, and both are
 * built from the same design system and the same repositories.
 */
export function HomeScreen() {
  const user = useCurrentUser();

  if (user?.userType === 'ORGANIZATION') {
    return <OrganizationHomeScreen />;
  }

  return <ConsumerHomeScreen />;
}
