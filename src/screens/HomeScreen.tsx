import { Screen } from '@/navigation';
import { useCurrentUser } from '@/state';
import { copy } from '@/content';
import { ScreenPlaceholder } from './_scaffold/ScreenPlaceholder';

/**
 * Home resolves by role — one route, two experiences.
 *
 * The real screens are built later (Organization Home in Increment 2, Consumer
 * Home in Increment 3). What is proven here is the split itself: the same path
 * renders a different experience depending on the authenticated user's type,
 * with no separate app and no duplicated route.
 */
export function HomeScreen() {
  const user = useCurrentUser();
  const isOrganization = user?.userType === 'ORGANIZATION';

  return (
    <Screen title={copy.app.name} subtitle={user ? copy.userType[user.userType] : undefined}>
      {isOrganization ? (
        <ScreenPlaceholder
          increment="Increment 2 — Organization Home"
          purpose="What is happening across my organization, and what needs my attention?"
          contents={[
            'Attention Required — deliveries awaiting receipt, quantity discrepancies, applications needing action',
            'Business Overview — active projects, packages, orders, available inventory',
            'Quick Actions — Find Stock Point, Create Enquiry, Receive Mineral',
            'Active Deliveries — vehicle, mineral, quantity, project, package, status',
            'Inventory Snapshot — available quantity across active packages',
            'Temporary Excavation — active applications and entry to the module',
          ]}
        />
      ) : (
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
      )}
    </Screen>
  );
}
