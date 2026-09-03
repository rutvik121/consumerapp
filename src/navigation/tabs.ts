import { Activity, BarChart3, Home, Layers, MoreHorizontal } from 'lucide-react';
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
 *   Normal Consumer   Home · Activity · Report · More
 *
 * Two tab sets, ONE navigation component. This is the visible expression of
 * "one application, two experiences".
 */
export const TABS_BY_USER_TYPE: Record<UserType, readonly TabItem[]> = {
  ORGANIZATION: [
    { label: copy.nav.home, path: ROUTES.home, icon: Home },
    { label: copy.nav.projects, path: ROUTES.projects, icon: Layers },
    { label: copy.nav.activity, path: ROUTES.activity, icon: Activity },
    { label: copy.nav.more, path: ROUTES.more, icon: MoreHorizontal },
  ],

  NORMAL_CONSUMER: [
    { label: copy.nav.home, path: ROUTES.home, icon: Home },
    { label: copy.nav.activity, path: ROUTES.activity, icon: Activity },
    { label: copy.nav.report, path: ROUTES.reports, icon: BarChart3 },
    { label: copy.nav.more, path: ROUTES.more, icon: MoreHorizontal },
  ],
};

export function tabsFor(userType: UserType): readonly TabItem[] {
  return TABS_BY_USER_TYPE[userType];
}
