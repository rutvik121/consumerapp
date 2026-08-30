import { Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';

export interface LoadingStateProps {
  /**
   * `list`   — skeleton rows. Use when the shape of the result is known.
   * `screen` — centred spinner for a whole screen.
   * `inline` — small spinner inside an existing block.
   */
  variant?: 'list' | 'screen' | 'inline';
  rows?: number;
  label?: string;
  className?: string;
}

/**
 * Skeletons are preferred over spinners wherever the layout is predictable:
 * they preserve the page structure so content does not jump when it lands.
 */
export function LoadingState({
  variant = 'list',
  rows = 4,
  label = 'Loading',
  className,
}: LoadingStateProps) {
  if (variant === 'inline') {
    return (
      <span className={cn('inline-flex items-center gap-2 text-body-sm text-ink-muted', className)}>
        <Loader2 size={15} className="animate-spin" aria-hidden />
        {label}
      </span>
    );
  }

  if (variant === 'screen') {
    return (
      <div
        role="status"
        aria-label={label}
        className={cn('flex flex-1 flex-col items-center justify-center gap-3 py-16', className)}
      >
        <Loader2 size={24} className="animate-spin text-primary-500" aria-hidden />
        <span className="text-body-sm text-ink-muted">{label}</span>
      </div>
    );
  }

  return (
    <div role="status" aria-label={label} className={cn('divide-y divide-line bg-surface', className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-start gap-3 px-4 py-4">
          <span className="size-9 shrink-0 animate-pulse rounded-md bg-neutral-100" />
          <span className="flex-1 space-y-2 py-0.5">
            <span className="block h-3 w-1/2 animate-pulse rounded-xs bg-neutral-100" />
            <span className="block h-2.5 w-3/4 animate-pulse rounded-xs bg-neutral-100" />
          </span>
          <span className="h-5 w-14 shrink-0 animate-pulse rounded-sm bg-neutral-100" />
        </div>
      ))}
    </div>
  );
}
