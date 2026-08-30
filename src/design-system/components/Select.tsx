import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

/**
 * Wraps the NATIVE <select> on purpose.
 *
 * On mobile the native picker is the most usable control there is: it is
 * familiar, fully accessible, works one-handed, and never traps focus. A
 * custom dropdown would look more designed and behave worse.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, options, placeholder, className, id, required, disabled, ...rest },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const describedBy = error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-label text-ink-secondary">
          {label}
          {required && <span className="ml-0.5 text-danger-500">*</span>}
        </label>
      )}

      <div
        className={cn(
          'relative flex items-center rounded-md border bg-surface',
          'h-[var(--control-h-md)] transition-colors',
          'focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100',
          error ? 'border-danger-500' : 'border-line-strong',
          disabled && 'bg-neutral-50 opacity-70',
          className,
        )}
      >
        <select
          ref={ref}
          id={selectId}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'w-full appearance-none bg-transparent px-3 pr-9 text-body text-ink outline-none',
            'disabled:cursor-not-allowed',
          )}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={17}
          className="pointer-events-none absolute right-3 text-ink-muted"
          aria-hidden
        />
      </div>

      {error ? (
        <p id={`${selectId}-error`} className="mt-1.5 text-caption text-danger-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${selectId}-hint`} className="mt-1.5 text-caption text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
