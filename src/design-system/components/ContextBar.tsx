import { ChevronRight, Layers } from 'lucide-react';
import { cn } from '../utils/cn';

export interface ContextBarProps {
  /** Project name. */
  primary: string;
  /** Package name. Omitted when the user is scoped to a project only. */
  secondary?: string;
  /** Offers a way out of the current scope. Omit to make context read-only. */
  onChange?: () => void;
  changeLabel?: string;
  className?: string;
}

/**
 * CONTEXT PRESERVATION, made visible.
 *
 *     Mumbai–Nashik Highway Widening  ›  Package A
 *
 * The product rule is "do not ask users to select context they have already
 * chosen". The corollary is that they must be able to SEE the context they are
 * operating inside, or they cannot trust that the app knows it. This strip is
 * that guarantee, and it rides along under the AppBar through every scoped
 * flow: discovery, enquiry, order, tracking, receiving, inventory, consumption.
 *
 * Purely presentational — it takes strings. The store-connected wrapper is
 * built in Increment 2 when Projects and Packages exist.
 */
export function ContextBar({
  primary,
  secondary,
  onChange,
  changeLabel = 'Change',
  className,
}: ContextBarProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 border-t border-line bg-primary-50/60 px-4 py-2',
        className,
      )}
    >
      <Layers size={14} className="shrink-0 text-primary-600" aria-hidden />

      <div className="flex min-w-0 flex-1 items-center gap-1 text-label">
        <span className={cn('truncate', secondary ? 'text-ink-secondary' : 'text-ink')}>
          {primary}
        </span>
        {secondary && (
          <>
            <ChevronRight size={13} className="shrink-0 text-neutral-400" aria-hidden />
            <span className="truncate font-medium text-ink">{secondary}</span>
          </>
        )}
      </div>

      {onChange && (
        <button
          type="button"
          onClick={onChange}
          className="shrink-0 rounded-sm px-1 py-0.5 text-label font-medium text-primary-700 hover:bg-primary-100"
        >
          {changeLabel}
        </button>
      )}
    </div>
  );
}
