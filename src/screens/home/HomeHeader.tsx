import { Bell } from 'lucide-react';
import { cn } from '@/design-system';

export interface HomeHeaderProps {
  userName: string;
  userRole?: string;
  regNumber?: string;
  notificationCount?: number;
  onNotificationClick?: () => void;
  isKycVerified?: boolean;
  className?: string;
}

/**
 * Institutional dark-navy header matching the Mahakhanij consumer & organization UI.
 * Displays greeting, name, role badge, KYC verification badge, registration ID, and notifications.
 */
export function HomeHeader({
  userName,
  userRole = 'Individual',
  regNumber = 'CON-2024-10425',
  notificationCount = 3,
  onNotificationClick,
  isKycVerified = true,
  className,
}: HomeHeaderProps) {
  function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  return (
    <div
      className={cn(
        'relative bg-[#102d5e] px-4 pb-4 pt-[calc(var(--safe-top)+0.75rem)] text-white shadow-sm',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-caption font-medium text-neutral-300 tracking-wide">
            {getGreeting()}
          </p>
          <h1 className="mt-0.5 text-title-lg font-bold text-white tracking-tight">
            {userName}
          </h1>
        </div>

        <button
          type="button"
          onClick={onNotificationClick}
          aria-label={`Notifications (${notificationCount} unread)`}
          className="relative flex size-9 items-center justify-center rounded-full bg-white/12 text-white transition-colors hover:bg-white/20 active:scale-95"
        >
          <Bell size={18} />
          {notificationCount > 0 && (
            <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] font-bold text-white shadow-xs">
              {notificationCount}
            </span>
          )}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2.5">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-400/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300 capitalize">
            {userRole}
          </span>

          {isKycVerified && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              KYC Verified
            </span>
          )}
        </div>

        {regNumber && (
          <span className="text-[11px] font-medium text-neutral-300/90 tabular tracking-wide">
            {regNumber}
          </span>
        )}
      </div>
    </div>
  );
}
