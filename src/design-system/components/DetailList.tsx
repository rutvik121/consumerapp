import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface DetailItem {
  label: string;
  value: ReactNode;
  /** Renders the value in tabular figures — quantities, numbers, references. */
  numeric?: boolean;
}

/**
 * Label/value pairs for detail screens.
 *
 * Operational screens are mostly this: an enquiry, an order, a permit, a
 * receipt. Having one component means every detail screen aligns, wraps and
 * spaces identically instead of each being hand-laid.
 */
export function DetailList({ items, className }: { items: DetailItem[]; className?: string }) {
  return (
    <dl className={cn('divide-y divide-line', className)}>
      {items.map((item) => (
        <div key={item.label} className="flex items-start justify-between gap-4 px-4 py-3">
          <dt className="shrink-0 text-body-sm text-ink-secondary">{item.label}</dt>
          <dd
            className={cn(
              'min-w-0 text-right text-body text-ink',
              item.numeric && 'tabular font-medium',
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
