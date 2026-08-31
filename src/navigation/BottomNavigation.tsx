import { NavLink } from 'react-router-dom';
import type { UserType } from '@/domain';
import { cn } from '@/design-system';
import { tabsFor } from './tabs';

/**
 * One component, two tab sets, resolved from the authenticated user's type.
 *
 * Touch targets exceed the 44px floor and labels are always visible — icon-only
 * navigation forces users to guess, which the UX principles rule out.
 */
export function BottomNavigation({ userType }: { userType: UserType }) {
  const tabs = tabsFor(userType);

  return (
    <nav
      aria-label="Main"
      className="relative z-30 shrink-0 border-t border-line bg-surface pb-[var(--safe-bottom)]"
    >
      <ul className="flex h-[var(--bottomnav-h)] items-start justify-center px-2 pt-2.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <li key={tab.path} className="flex-1">
              <NavLink
                to={tab.path}
                className={({ isActive }) =>
                  cn(
                    'flex h-[52px] flex-col items-center justify-center gap-[5px] px-1 transition-colors',
                    isActive ? 'text-primary-600' : 'text-ink-muted hover:text-ink-secondary',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex h-[26px] w-11 items-center justify-center rounded-full',
                        isActive && 'bg-primary-50',
                      )}
                    >
                      <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} aria-hidden />
                    </span>
                    <span
                      className={cn(
                        'text-caption leading-none',
                        isActive ? 'font-semibold' : 'font-normal',
                      )}
                    >
                      {tab.label}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
