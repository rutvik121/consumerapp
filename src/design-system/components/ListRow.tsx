import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';

export interface ListRowProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Third line for dense operational detail — vehicle, quantity, e-TP, etc. */
  detail?: ReactNode;
  /** Left slot: icon, avatar, or index. */
  leading?: ReactNode;
  /** Right slot above the chevron: status badge, quantity, timestamp. */
  meta?: ReactNode;
  /** Replaces the default chevron. Pass `null` to remove it entirely. */
  trailing?: ReactNode | null;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * The workhorse of the app. Most operational lists are ListRows, not cards.
 *
 * Renders as a <button> when interactive so keyboard and screen-reader
 * semantics are correct without extra work at the call site.
 */
export function ListRow({
  title,
  subtitle,
  detail,
  leading,
  meta,
  trailing,
  onClick,
  disabled = false,
  className,
}: ListRowProps) {
  const interactive = Boolean(onClick) && !disabled;

  const content = (
    <>
      {leading && (
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-600">
          {leading}
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className="block truncate text-title text-ink">{title}</span>
        {subtitle && (
          <span className="mt-0.5 block truncate text-body-sm text-ink-secondary">{subtitle}</span>
        )}
        {detail && (
          <span className="mt-1 block truncate text-caption text-ink-muted tabular">{detail}</span>
        )}
      </span>

      {meta && <span className="ml-1 flex shrink-0 flex-col items-end gap-1">{meta}</span>}

      {trailing === undefined
        ? interactive && (
            <ChevronRight size={18} className="mt-0.5 shrink-0 text-neutral-400" aria-hidden />
          )
        : trailing}
    </>
  );

  const base = cn(
    'flex w-full items-start gap-3 px-4 py-3 text-left',
    'min-h-[var(--touch-comfortable)]',
    disabled && 'opacity-55',
    className,
  );

  if (!interactive) {
    return <div className={base}>{content}</div>;
  }

  return (
    <button type="button" onClick={onClick} className={cn(base, 'pressable hover:bg-neutral-50 active:bg-neutral-100')}>
      {content}
    </button>
  );
}

/**
 * Groups ListRows with hairline separators.
 *
 * Separation by hairline rather than by wrapping each row in its own card is
 * what keeps dense operational lists calm.
 */
export function ListGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('divide-y divide-line bg-surface', className)}>{children}</div>
  );
}
