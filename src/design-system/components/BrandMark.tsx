import { cn } from '../utils/cn';

export interface BrandMarkProps {
  size?: 'md' | 'lg';
  /** Shows the Revenue Department attribution beneath the name. */
  showAttribution?: boolean;
  className?: string;
}

/**
 * The application's identity.
 *
 * The quarry-face glyph is the source end of the journey this app completes,
 * and the attribution line is what grounds the product as government-connected
 * rather than a private marketplace. Both matter on the first screen a user
 * ever sees, where trust is established or lost.
 */
export function BrandMark({ size = 'md', showAttribution = false, className }: BrandMarkProps) {
  const glyph = size === 'lg' ? 'size-14' : 'size-10';

  return (
    <div className={cn('flex flex-col items-center text-center', className)}>
      <svg viewBox="0 0 32 32" className={cn(glyph, 'rounded-lg')} role="img" aria-label="Mahakhanij">
        <rect width="32" height="32" rx="7" fill="var(--color-primary-800)" />
        <path d="M6 23h5v-4h5v-4h5v-4h5v12H6z" fill="var(--color-primary-400)" opacity=".55" />
        <path
          d="M6 23h5v-4h5v-4h5v-4h5"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="26" cy="11" r="2.4" fill="#ffffff" />
      </svg>

      <p className={cn('mt-3 text-ink', size === 'lg' ? 'text-display' : 'text-title-lg')}>
        Mahakhanij
      </p>

      {showAttribution && (
        <p className="mt-1.5 max-w-[26ch] text-caption text-ink-muted">
          Revenue Department, Government of Maharashtra
        </p>
      )}
    </div>
  );
}
