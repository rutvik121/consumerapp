import { useEffect, useId, useRef } from 'react';
import { cn } from '../utils/cn';

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  /** Fires when the final digit is entered — enables auto-submit. */
  onComplete?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  label?: string;
}

/**
 * Verification code entry.
 *
 * Rendered as separate boxes because that is the pattern users recognise, but
 * driven by ONE real input underneath. Six independent inputs are a well-known
 * source of bugs — broken paste, backspace that skips, autofill that fills only
 * the first box, and screen readers announcing six unlabelled fields.
 *
 * `autoComplete="one-time-code"` lets iOS and Android offer the SMS code
 * directly from the keyboard, which removes the step of leaving the app to
 * read a message.
 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  onComplete,
  error,
  disabled = false,
  autoFocus = false,
  label = 'Verification code',
}: OtpInputProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const completedFor = useRef<string | null>(null);

  useEffect(() => {
    if (value.length === length) {
      // Guard against re-firing for a value already submitted.
      if (completedFor.current !== value) {
        completedFor.current = value;
        onComplete?.(value);
      }
    } else {
      completedFor.current = null;
    }
  }, [value, length, onComplete]);

  const digits = Array.from({ length }, (_, index) => value[index] ?? '');
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <div>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>

      <div
        className="relative"
        onClick={() => inputRef.current?.focus()}
        role="presentation"
      >
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus={autoFocus}
          disabled={disabled}
          maxLength={length}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, length))}
          className="absolute inset-0 z-10 h-full w-full cursor-default opacity-0"
        />

        <div className="flex justify-between gap-2" aria-hidden>
          {digits.map((digit, index) => {
            const isActive = !disabled && index === activeIndex && value.length < length;
            const isFilled = digit !== '';

            return (
              <span
                key={index}
                className={cn(
                  'tabular flex h-[52px] flex-1 items-center justify-center rounded-md border text-title-lg transition-colors',
                  error
                    ? 'border-danger-500 bg-danger-50/40 text-danger-700'
                    : isFilled
                      ? 'border-primary-500 bg-surface text-ink'
                      : 'border-line-strong bg-surface text-ink',
                  isActive && !error && 'border-primary-500 ring-2 ring-primary-100',
                  disabled && 'opacity-60',
                )}
              >
                {digit || <span className="text-neutral-300">·</span>}
              </span>
            );
          })}
        </div>
      </div>

      {error && (
        <p id={`${inputId}-error`} role="alert" className="mt-2 text-caption text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
