import { Outlet } from 'react-router-dom';
import { OVERLAY_ROOT_ID } from '@/design-system';
import { useCurrentUser } from '@/state';
import { PrototypeBar } from '@/prototype/PrototypeBar';
import { BottomNavigation } from './BottomNavigation';

/**
 * THE MOBILE SHELL.
 *
 * On a phone the app fills the viewport. On a desktop browser it renders
 * inside a device frame rather than stretching to fill the window — this is a
 * mobile product, and showing it at mobile width is the honest way to review
 * it. It is a presentation choice in this one file, not a layout constraint
 * baked into screens: every screen below is fluid and would fill a real device
 * of any size.
 *
 * The shell owns three things and nothing else:
 *   1. the device frame and safe areas
 *   2. the role-driven bottom navigation
 *   3. the overlay root that sheets and dialogs portal into, so overlays stay
 *      contained within the phone instead of covering the whole browser
 */
export function AppShell() {
  const user = useCurrentUser();

  return (
    <div className="flex h-full justify-center bg-neutral-100 sm:items-center sm:p-6">
      <div
        className={[
          'relative flex w-full flex-col overflow-hidden bg-canvas',
          'h-full sm:h-[var(--device-h)] sm:max-h-full sm:w-[var(--device-w)]',
          'sm:rounded-2xl sm:border sm:border-neutral-300 sm:shadow-e3',
        ].join(' ')}
      >
        {/* PROTOTYPE ONLY — delete this line and src/prototype to ship. */}
        <PrototypeBar />

        <Outlet />

        {user && <BottomNavigation userType={user.userType} />}

        {/* Overlay portal target. pointer-events-none so it never blocks taps
            while empty; sheets and dialogs re-enable events on themselves. */}
        <div id={OVERLAY_ROOT_ID} className="pointer-events-none absolute inset-0 z-40" />
      </div>
    </div>
  );
}
