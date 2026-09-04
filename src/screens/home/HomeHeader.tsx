import { Bell } from 'lucide-react';
import { cn } from '@/design-system';
import mahakhanijEmblem from '@/assets/mahakhanij-emblem.png';

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
  notificationCount = 4,
  onNotificationClick,
  className,
}: HomeHeaderProps) {
  return (
    <div
      className={cn(
        'relative bg-[#102d5e] px-4 py-2.5 pt-[calc(var(--safe-top)+0.65rem)] pb-3 text-white shadow-xs',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* MahaKhanij Emblem Logo */}
          <div className="flex size-8.5 shrink-0 items-center justify-center">
            <img
              src={mahakhanijEmblem}
              alt="MahaKhanij Emblem"
              className="size-full object-contain select-none"
            />
          </div>

          <div>
            <p className="text-[11.5px] font-normal text-neutral-300 leading-tight">
              Welcome
            </p>
            <h1 className="mt-0.5 text-[15px] font-bold text-white tracking-tight leading-tight">
              {userName}
            </h1>
          </div>
        </div>

        {/* Notification Bell Button */}
        <button
          type="button"
          onClick={onNotificationClick}
          aria-label={`Notifications (${notificationCount} unread)`}
          className="relative flex size-9 items-center justify-center rounded-full bg-white/12 text-white transition-colors hover:bg-white/20 active:scale-95"
        >
          <Bell size={17} className="text-white" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] font-bold text-white shadow-xs ring-2 ring-[#102d5e]">
              {notificationCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
