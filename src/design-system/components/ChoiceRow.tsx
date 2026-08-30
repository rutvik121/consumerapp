import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../utils/cn';

export interface ChoiceRowProps {
  title: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
  /** Optional leading icon. Omit for text-only choices. */
  leading?: ReactNode;
  disabled?: boolean;
}

/**
 * A single selectable option in a radio group.
 *
 * Used wherever the user makes one consequential choice from a short list —
 * user type at registration, and later mineral selection and discrepancy
 * reason. The description line matters: for choices that shape the whole
 * experience, a bare label leaves the user guessing.
 */
export function ChoiceRow({
  title,
  description,
  selected,
  onSelect,
  leading,
  disabled = false,
}: ChoiceRowProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'pressable flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors',
        selected
          ? 'border-primary-500 bg-primary-50/60 ring-1 ring-primary-500'
          : 'border-line-strong bg-surface hover:bg-neutral-50',
        disabled && 'cursor-not-allowed opacity-55',
      )}
    >
      {leading && (
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-md',
            selected ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-ink-muted',
          )}
        >
          {leading}
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className="block text-title text-ink">{title}</span>
        {description && (
          <span className="mt-1 block text-body-sm text-ink-secondary">{description}</span>
        )}
      </span>

      <span
        className={cn(
          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          selected ? 'border-primary-600 bg-primary-600 text-ink-inverse' : 'border-line-strong',
        )}
        aria-hidden
      >
        {selected && <Check size={12} strokeWidth={3} />}
      </span>
    </button>
  );
}

/** Groups ChoiceRows with correct radio-group semantics. */
export function ChoiceGroup({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('space-y-3', className)}>
      {children}
    </div>
  );
}
