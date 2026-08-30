import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';

export interface ChipProps {
  label: string;
  /** Renders a selected/active treatment. */
  active?: boolean;
  leading?: ReactNode;
  onClick?: () => void;
  /** Shows a remove affordance. Use for applied filters. */
  onRemove?: () => void;
  className?: string;
}

/**
 * A compact, tappable token — an applied filter, a selectable option.
 *
 * Distinct from StatusBadge on purpose: a badge REPORTS state and is never
 * interactive; a chip is something the user acts on. Using one for the other
 * teaches people that colour-coded pills sometimes do nothing.
 */
export function Chip({ label, active = false, leading, onClick, onRemove, className }: ChipProps) {
  const interactive = Boolean(onClick);

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border py-1.5 text-label whitespace-nowrap transition-colors',
        onRemove ? 'pr-1.5 pl-3' : 'px-3',
        active
          ? 'border-primary-500 bg-primary-50 text-primary-700'
          : 'border-line-strong bg-surface text-ink-secondary',
        interactive && !active && 'hover:bg-neutral-50',
        className,
      )}
    >
      {interactive ? (
        <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5">
          {leading}
          {label}
        </button>
      ) : (
        <>
          {leading}
          {label}
        </>
      )}

      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${label}`}
          onClick={onRemove}
          className={cn(
            'flex size-5 items-center justify-center rounded-full',
            active ? 'hover:bg-primary-100' : 'hover:bg-neutral-100',
          )}
        >
          <X size={13} aria-hidden />
        </button>
      )}
    </span>
  );
}
