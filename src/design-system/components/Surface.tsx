import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils/cn';

export type SurfaceVariant = 'plain' | 'raised' | 'outlined' | 'sunken';

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant;
  /** Applies the standard 16px gutter. */
  padded?: boolean;
  /** Rounds corners — use for inset blocks, not for full-bleed sections. */
  rounded?: boolean;
  children: ReactNode;
}

/**
 * The anti-card primitive.
 *
 * DESIGN RULE: default to `plain` — a flat white section on the canvas,
 * separated from its neighbours by a gap or a hairline. Reach for `raised` or
 * `outlined` only when a block must genuinely lift off the page.
 *
 * NEVER nest a raised/outlined Surface inside another. Card-inside-card is
 * explicitly called out as something to avoid.
 */
const VARIANT: Record<SurfaceVariant, string> = {
  plain: 'bg-surface',
  raised: 'bg-surface shadow-e1',
  outlined: 'bg-surface border border-line',
  sunken: 'bg-surface-sunken',
};

export function Surface({
  variant = 'plain',
  padded = false,
  rounded = false,
  className,
  children,
  ...rest
}: SurfaceProps) {
  return (
    <div
      className={cn(VARIANT[variant], padded && 'p-4', rounded && 'rounded-lg', className)}
      {...rest}
    >
      {children}
    </div>
  );
}
