import type { StatusTone } from '@/rules';
import { cn } from '../utils/cn';

export interface StatusBadgeProps {
  label: string;
  /** Comes from @/rules/statusPresentation — never hand-picked in a screen. */
  tone: StatusTone;
  size?: 'sm' | 'md';
  /** Adds a leading dot. Useful in dense lists where colour alone is subtle. */
  dot?: boolean;
  className?: string;
}

const TONE: Record<StatusTone, string> = {
  neutral: 'bg-neutral-100 text-ink-secondary',
  info: 'bg-primary-50 text-primary-700',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  danger: 'bg-danger-50 text-danger-700',
};

const DOT: Record<StatusTone, string> = {
  neutral: 'bg-neutral-400',
  info: 'bg-primary-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
};

/**
 * Status is one of the highest-priority pieces of information in an
 * operational app. Tone carries meaning, never decoration.
 *
 * Accessibility: colour is never the only signal — the label always states the
 * status in words.
 */
export function StatusBadge({ label, tone, size = 'md', dot = false, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-sm font-medium whitespace-nowrap',
        size === 'sm' ? 'px-1.5 py-0.5 text-caption' : 'px-2 py-1 text-label',
        TONE[tone],
        className,
      )}
    >
      {dot && <span className={cn('size-1.5 rounded-full', DOT[tone])} aria-hidden />}
      {label}
    </span>
  );
}
