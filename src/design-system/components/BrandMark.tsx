import { cn } from '../utils/cn';
import mahakhanijLogo from '@/assets/mahakhanij-logo.png';

export interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
  /** Shows the Revenue Department attribution beneath the name. */
  showAttribution?: boolean;
  /** Whether to show the text title beneath the logo (defaults to false since logo includes wordmark) */
  showTitle?: boolean;
  className?: string;
}

/**
 * The application's identity.
 *
 * Displays the official MahaKhanij 2.0 logo with the optional Revenue Department
 * attribution grounding the product as government-connected.
 */
export function BrandMark({
  size = 'md',
  showAttribution = false,
  showTitle = false,
  className,
}: BrandMarkProps) {
  const logoHeight =
    size === 'lg' ? 'h-16 sm:h-[72px]' : size === 'sm' ? 'h-8' : 'h-11';

  return (
    <div className={cn('flex flex-col items-center text-center', className)}>
      <img
        src={mahakhanijLogo}
        alt="MahaKhanij 2.0"
        className={cn(logoHeight, 'w-auto object-contain select-none')}
      />

      {showTitle && (
        <p className={cn('mt-3 text-ink font-semibold', size === 'lg' ? 'text-display' : 'text-title-lg')}>
          Mahakhanij
        </p>
      )}

      {showAttribution && (
        <p className="mt-2.5 max-w-[28ch] text-caption text-ink-muted">
          Revenue Department, Government of Maharashtra
        </p>
      )}
    </div>
  );
}
