import { Boxes, Home, Layers, MoreHorizontal, Package } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { UserType } from '@/domain';
import { copy } from '@/content';
import { ROUTES } from './routes';

export interface TabItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

/**
 * ROLE-DRIVEN BOTTOM NAVIGATION.
 *
 *   Organization      Home · Projects · Orders · More
 *   Normal Consumer   Home · Mineral  · Orders · More
 *
 * Two tab sets, ONE navigation component. This is the visible expression of
 * "one application, two experiences".
 *
 * Note what is absent from the consumer set: Projects and Packages never
 * appear, and Temporary Excavation appears in neither — it is reached from
 * within the Organization experience and is protected at the route level, so
 * it can never be surfaced to a consumer by a navigation change alone.
 */
export const TABS_BY_USER_TYPE: Record<UserType, readonly TabItem[]> = {
  ORGANIZATION: [
    { label: copy.nav.home, path: ROUTES.home, icon: Home },
    { label: copy.nav.projects, path: ROUTES.projects, icon: Layers },
    { label: copy.nav.orders, path: ROUTES.orders, icon: Package },
    { label: copy.nav.more, path: ROUTES.more, icon: MoreHorizontal },
  ],

  NORMAL_CONSUMER: [
    { label: copy.nav.home, path: ROUTES.home, icon: Home },
    { label: copy.nav.mineral, path: ROUTES.mineral, icon: Boxes },
    { label: copy.nav.orders, path: ROUTES.orders, icon: Package },
    { label: copy.nav.more, path: ROUTES.more, icon: MoreHorizontal },
  ],
};

export function tabsFor(userType: UserType): readonly TabItem[] {
  return TABS_BY_USER_TYPE[userType];
}
