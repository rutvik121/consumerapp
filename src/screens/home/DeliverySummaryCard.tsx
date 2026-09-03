import { cn } from '@/design-system';

export interface DeliveryItemSummary {
  id: string;
  code: string;
  destination: string;
  mineralName: string;
  quantity: string;
  status: 'IN_TRANSIT' | 'APPROVED' | 'DELIVERED' | string;
  onClick?: () => void;
}

export function DeliverySummaryCard({ item }: { item: DeliveryItemSummary }) {
  const statusConfig = getStatusBadge(item.status);

  return (
    <div
      onClick={item.onClick}
      className={cn(
        'group cursor-pointer rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs transition-all hover:border-primary-300 hover:shadow-sm',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-body-sm font-semibold tracking-wide text-[#1241a6]">
          {item.code}
        </span>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-caption font-semibold',
            statusConfig.className,
          )}
        >
          {statusConfig.label}
        </span>
      </div>

      <p className="mt-1.5 text-body font-bold text-ink group-hover:text-primary-800 transition-colors">
        {item.destination}
      </p>

      <div className="mt-2 flex items-baseline justify-between border-t border-neutral-100 pt-2 text-caption">
        <span className="font-medium text-neutral-500">{item.mineralName}</span>
        <span className="tabular text-body-sm font-bold text-ink">{item.quantity}</span>
      </div>
    </div>
  );
}

function getStatusBadge(status: string): { label: string; className: string } {
  const normalized = status.toUpperCase();
  if (normalized.includes('TRANSIT') || normalized === 'DISPATCHED') {
    return {
      label: 'In Transit',
      className: 'bg-[#f4eafc] text-[#7e22ce]',
    };
  }
  if (normalized.includes('APPROV') || normalized === 'SCHEDULED') {
    return {
      label: 'Approved',
      className: 'bg-[#e0f2fe] text-[#0369a1]',
    };
  }
  if (normalized.includes('DELIVER') || normalized.includes('RECEIV')) {
    return {
      label: 'Delivered',
      className: 'bg-[#dcfce7] text-[#15803d]',
    };
  }
  return {
    label: status,
    className: 'bg-neutral-100 text-neutral-700',
  };
}
