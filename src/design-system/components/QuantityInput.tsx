import { useId } from 'react';
import type { MineralUnit } from '@/domain';
import { cn } from '../utils/cn';

export interface QuantityInputProps {
  label?: string;
  value: number | null;
  unit: MineralUnit;
  onChange: (value: number | null) => void;
  hint?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  className?: string;
}

/**
 * Quantity entry — the single most consequential input in the app.
 *
 * Deliberate choices:
 *   · Large display type. Read at arm's length, outdoors, in sunlight.
 *   · Tabular figures, so digits do not shift while typing.
 *   · inputMode="decimal" so the numeric keypad opens on a real device.
 *   · Unit is shown, never typed — it comes from the mineral, not the user.
 *   · No stepper buttons: real quantities are weighbridge readings like
 *     47.35, not values you nudge up and down.
 */
export function QuantityInput({
  label,
  value,
  unit,
  onChange,
  hint,
  error,
  placeholder = '0',
  disabled = false,
  required = false,
  autoFocus = false,
  className,
}: QuantityInputProps) {
  const inputId = useId();
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  function handleChange(raw: string) {
    if (raw.trim() === '') {
      onChange(null);
      return;
    }
    // Accept digits and a single decimal point only.
    if (!/^\d*\.?\d*$/.test(raw)) return;

    const parsed = Number.parseFloat(raw);
    onChange(Number.isNaN(parsed) ? null : parsed);
  }

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-label text-ink-secondary">
          {label}
          {required && <span className="ml-0.5 text-danger-500">*</span>}
        </label>
      )}

      <div
        className={cn(
          'flex items-baseline gap-2 rounded-md border bg-surface px-4 py-3',
          'transition-colors focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100',
          error ? 'border-danger-500' : 'border-line-strong',
          disabled && 'bg-neutral-50 opacity-70',
        )}
      >
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          autoFocus={autoFocus}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          value={value ?? ''}
          onChange={(event) => handleChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'tabular min-w-0 flex-1 bg-transparent text-display text-ink outline-none',
            'placeholder:text-neutral-300 disabled:cursor-not-allowed',
          )}
        />
        <span className="shrink-0 text-title text-ink-muted">{unit}</span>
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-caption text-danger-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-caption text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
