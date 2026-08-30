import { Screen } from '@/navigation';
import { useCurrentUser } from '@/state';
import { copy } from '@/content';
import { OrganizationHomeScreen } from './organization';
import { ScreenPlaceholder } from './_scaffold/ScreenPlaceholder';

/**
 * Home resolves by role — ONE route, two experiences.
 *
 * This is the structural expression of "one application, two authenticated
 * experiences". There is no separate organization app and no duplicated route;
 * the authenticated user's type decides which experience renders.
 */
export function HomeScreen() {
  const user = useCurrentUser();

  if (user?.userType === 'ORGANIZATION') {
    return <OrganizationHomeScreen />;
  }

  return (
    <Screen title={copy.app.name} subtitle={user ? copy.userType[user.userType] : undefined}>
      <ScreenPlaceholder
        increment="Increment 3 — Consumer Home"
        purpose="Where do I get mineral, and what is happening with what I already ordered?"
        contents={[
          'Active delivery, when one is in transit or awaiting receipt',
          'Find Stock Point as the primary action',
          'Recent enquiries and orders',
          'Available inventory',
          'No projects, packages, or Temporary Excavation — ever',
        ]}
      />
    </Screen>
  );
}
