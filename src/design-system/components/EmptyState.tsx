import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '../utils/cn';

export interface EmptyStateProps {
  title: string;
  /** One short sentence. Say what is missing and what to do about it. */
  description?: string;
  icon?: ReactNode;
  /** The single next action, when there is a sensible one. */
  action?: ReactNode;
  className?: string;
}

/**
 * An empty list is a moment of doubt: "is it broken, or is there nothing?"
 * Always answer that, and offer the way forward when one exists.
 */
export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center px-8 py-12 text-center', className)}>
      <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
        {icon ?? <Inbox size={22} aria-hidden />}
      </span>
      <h3 className="text-title text-ink">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-[36ch] text-body-sm text-ink-secondary">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
