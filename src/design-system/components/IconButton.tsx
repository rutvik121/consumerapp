import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils/cn';

export type IconButtonVariant = 'plain' | 'subtle' | 'solid';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required — an icon alone is never self-explanatory to a screen reader. */
  label: string;
  icon: ReactNode;
  variant?: IconButtonVariant;
}

const VARIANT: Record<IconButtonVariant, string> = {
  plain: 'text-ink-secondary hover:bg-neutral-100 active:bg-neutral-200',
  subtle: 'bg-primary-50 text-primary-700 hover:bg-primary-100 active:bg-primary-200',
  solid: 'bg-primary-600 text-ink-inverse hover:bg-primary-700 active:bg-primary-800',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ label, icon, variant = 'plain', className, type = 'button', ...rest }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        title={label}
        className={cn(
          'touch-target pressable inline-flex items-center justify-center rounded-md',
          'disabled:cursor-not-allowed disabled:text-ink-muted disabled:hover:bg-transparent',
          VARIANT[variant],
          className,
        )}
        {...rest}
      >
        {icon}
      </button>
    );
  },
);
