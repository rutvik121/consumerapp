import { AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/**
 * Say what failed in plain language and give exactly one way forward.
 * Never surface a raw error or a status code to an operational user.
 */
export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this. Check your connection and try again.',
  onRetry,
  retryLabel = 'Try again',
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center px-8 py-12 text-center', className)}
    >
      <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-danger-50 text-danger-500">
        <AlertTriangle size={22} aria-hidden />
      </span>
      <h3 className="text-title text-ink">{title}</h3>
      <p className="mt-1.5 max-w-[36ch] text-body-sm text-ink-secondary">{description}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-5">
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
