import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

export type MetricTone = 'default' | 'success' | 'warning' | 'danger';

export interface MetricTileProps {
  label: string;
  value: ReactNode;
  /** Rendered smaller and lighter, immediately after the value. */
  unit?: string;
  /** Supporting line, e.g. "Across active packages". */
  hint?: string;
  tone?: MetricTone;
  size?: 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

const TONE: Record<MetricTone, string> = {
  default: 'text-ink',
  success: 'text-success-600',
  warning: 'text-warning-600',
  danger: 'text-danger-600',
};

/**
 * A single operational number with its label.
 *
 * Quantities use tabular figures so columns of numbers align when tiles are
 * placed in a grid — important when scanning quickly on site.
 */
export function MetricTile({
  label,
  value,
  unit,
  hint,
  tone = 'default',
  size = 'md',
  onClick,
  className,
}: MetricTileProps) {
  const Element = onClick ? 'button' : 'div';

  return (
    <Element
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={cn(
        'flex min-w-0 flex-col gap-1 text-left',
        onClick && 'pressable rounded-md',
        className,
      )}
    >
      <span className="truncate text-label text-ink-secondary">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className={cn('tabular truncate', size === 'lg' ? 'text-display' : 'text-title-lg', TONE[tone])}>
          {value}
        </span>
        {unit && <span className="text-body-sm text-ink-muted">{unit}</span>}
      </span>
      {hint && <span className="truncate text-caption text-ink-muted">{hint}</span>}
    </Element>
  );
}
