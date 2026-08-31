import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  /** Guidance shown below the field. Hidden while an error is present. */
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  /** Trailing content inside the field — unit suffix, clear button, etc. */
  rightSlot?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leftIcon, rightSlot, className, id, required, disabled, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="w-full min-w-0">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-label text-ink-secondary">
          {label}
          {required && <span className="ml-0.5 text-danger-500">*</span>}
        </label>
      )}

      <div
        className={cn(
          'flex items-center gap-2 rounded-md border bg-surface px-3',
          'h-[var(--control-h-md)] transition-colors',
          'focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100',
          error ? 'border-danger-500' : 'border-line-strong',
          disabled && 'bg-neutral-50 opacity-70',
          className,
        )}
      >
        {leftIcon && <span className="shrink-0 text-ink-muted">{leftIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'min-w-0 flex-1 bg-transparent text-body text-ink outline-none',
            'placeholder:text-ink-muted disabled:cursor-not-allowed',
          )}
          {...rest}
        />
        {rightSlot && <span className="shrink-0">{rightSlot}</span>}
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
});
