import { useId, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../utils/cn';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** The statement being agreed to. Can carry emphasis, so ReactNode. */
  label: ReactNode;
  description?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * A single agreement, not a list filter.
 *
 * Built for the one place the product needs it — the declaration on the review
 * step — so the whole row is the target rather than a 16px box: a declaration
 * that is hard to tick is a declaration people tick without reading, and on a
 * phone a bare checkbox is well under the 44px minimum.
 *
 * The native input stays in the tree (visually hidden) so the control keeps
 * its role, focus behaviour and screen-reader announcement.
 */
export function Checkbox({
  checked,
  onChange,
  label,
  description,
  error,
  disabled = false,
  className,
}: CheckboxProps) {
  const id = useId();

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={cn(
          'flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors',
          checked ? 'border-primary-500 bg-primary-50/60' : 'border-line-strong bg-surface',
          error && !checked && 'border-danger-500',
          disabled && 'cursor-not-allowed opacity-55',
        )}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={cn(
            'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition-colors',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-100',
            checked
              ? 'border-primary-600 bg-primary-600 text-white'
              : 'border-line-strong bg-surface',
          )}
        >
          {checked && <Check size={13} strokeWidth={3} />}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-body-sm text-ink">{label}</span>
          {description && (
            <span className="mt-1 block text-caption text-ink-muted">{description}</span>
          )}
        </span>
      </label>

      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-caption text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
