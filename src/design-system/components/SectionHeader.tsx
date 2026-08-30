import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface SectionHeaderProps {
  title: string;
  /** Optional right-aligned action, e.g. "View all". */
  action?: ReactNode;
  /** Short supporting line under the title. Use sparingly. */
  description?: string;
  className?: string;
}

/**
 * Section headers create the vertical rhythm of every screen. Uppercase
 * overline styling keeps them clearly subordinate to content while still
 * making a long screen scannable.
 */
export function SectionHeader({ title, action, description, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-end justify-between gap-3 px-4 pt-5 pb-2', className)}>
      <div className="min-w-0">
        <h2 className="text-overline text-ink-muted uppercase">{title}</h2>
        {description && <p className="mt-1 text-body-sm text-ink-secondary">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
