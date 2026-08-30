import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'subtle' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /**
   * ONE CLEAR NEXT ACTION — a screen should have at most one `primary` button.
   * Everything else is `secondary`, `subtle`, or `ghost`.
   */
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-600 text-ink-inverse hover:bg-primary-700 active:bg-primary-800 disabled:bg-neutral-200 disabled:text-ink-muted',
  secondary:
    'bg-surface text-primary-700 border border-line-strong hover:bg-primary-50 active:bg-primary-100 disabled:text-ink-muted disabled:border-line',
  subtle:
    'bg-primary-50 text-primary-700 hover:bg-primary-100 active:bg-primary-200 disabled:bg-neutral-100 disabled:text-ink-muted',
  ghost:
    'bg-transparent text-primary-700 hover:bg-primary-50 active:bg-primary-100 disabled:text-ink-muted',
  danger:
    'bg-danger-500 text-ink-inverse hover:bg-danger-600 active:bg-danger-700 disabled:bg-neutral-200 disabled:text-ink-muted',
};

/** All sizes clear the 44px touch floor except `sm`, which is 36px and is
 *  reserved for inline actions that sit beside larger targets. */
const SIZE: Record<ButtonSize, string> = {
  sm: 'h-[var(--control-h-sm)] px-3 text-label gap-1.5 rounded-sm',
  md: 'h-[var(--control-h-md)] px-4 text-body gap-2 rounded-md',
  lg: 'h-[var(--control-h-lg)] px-5 text-body-lg gap-2 rounded-md',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    leftIcon,
    rightIcon,
    disabled,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'pressable inline-flex items-center justify-center font-medium select-none',
        'disabled:cursor-not-allowed disabled:active:scale-100',
        VARIANT[variant],
        SIZE[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" aria-hidden />
      ) : (
        leftIcon
      )}
      <span className="truncate">{children}</span>
      {!loading && rightIcon}
    </button>
  );
});
