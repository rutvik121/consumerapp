import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

/**
 * Free text. Used sparingly — an operational app should capture structured
 * data wherever it can, because a remarks field is not reportable.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id, rows = 3, required, ...rest },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={fieldId} className="mb-1.5 block text-label text-ink-secondary">
          {label}
          {required && <span className="ml-0.5 text-danger-500">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'w-full resize-none rounded-md border bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors',
          'placeholder:text-ink-muted',
          'focus:border-primary-500 focus:ring-2 focus:ring-primary-100',
          error ? 'border-danger-500' : 'border-line-strong',
          className,
        )}
        {...rest}
      />

      {error ? (
        <p id={`${fieldId}-error`} className="mt-1.5 text-caption text-danger-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="mt-1.5 text-caption text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
