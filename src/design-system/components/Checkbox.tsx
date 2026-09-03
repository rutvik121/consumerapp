import type { ReactNode } from 'react';
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
  const isChecked = Boolean(checked);

  return (
    <div className={className}>
      <div
        role="checkbox"
        aria-checked={isChecked}
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (!disabled) {
            onChange(!isChecked);
          }
        }}
        onKeyDown={(e) => {
          if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            onChange(!isChecked);
          }
        }}
        className={cn(
          'flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors select-none outline-none',
          'focus-visible:ring-2 focus-visible:ring-primary-400',
          isChecked ? 'border-primary-500 bg-primary-50/60' : 'border-line-strong bg-surface',
          error && !isChecked && 'border-danger-500',
          disabled && 'cursor-not-allowed opacity-55',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition-colors',
            isChecked
              ? 'border-primary-600 bg-primary-600 text-white'
              : 'border-line-strong bg-surface',
          )}
        >
          {isChecked && <Check size={13} strokeWidth={3} />}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-body-sm text-ink">{label}</span>
          {description && (
            <span className="mt-1 block text-caption text-ink-muted">{description}</span>
          )}
        </span>
      </div>

      {error && (
        <p className="mt-1.5 text-caption text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
