import { ChevronRight, FileCheck, Store } from 'lucide-react';
import { cn } from '@/design-system';

export interface DeliveryItemSummary {
  id: string;
  code: string;
  digiTpNumber?: string;
  purchasedFrom?: string;
  destination: string;
  mineralName: string;
  quantity: string;
  status: 'IN_TRANSIT' | 'APPROVED' | 'DELIVERED' | string;
  onClick?: () => void;
}

export function DeliverySummaryCard({ item }: { item: DeliveryItemSummary }) {
  const statusConfig = getStatusBadge(item.status);
  const digiTpCode = item.digiTpNumber || item.code;

  return (
    <div
      onClick={item.onClick}
      className={cn(
        'group relative cursor-pointer rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs transition-all hover:border-primary-300 hover:shadow-sm active:scale-[0.99]',
      )}
    >
      {/* Top row: DigiTP Label & Number + Status Pill */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="flex size-6 items-center justify-center rounded-md bg-[#eef4fe] text-[#1241a6]">
            <FileCheck size={14} />
          </span>
          <span className="text-body-sm font-bold tracking-tight text-[#1241a6]">
            DigiTP No: <span className="font-mono text-ink">{digiTpCode}</span>
          </span>
        </div>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-caption font-semibold',
            statusConfig.className,
          )}
        >
          {statusConfig.label}
        </span>
      </div>

      {/* Destination / Project */}
      <div className="mt-2.5">
        <p className="text-caption font-medium text-neutral-500">Destination</p>
        <p className="text-body font-bold text-ink group-hover:text-primary-800 transition-colors">
          {item.destination}
        </p>
      </div>

      {/* Mineral & Quantity */}
      <div className="mt-2.5 flex items-baseline justify-between rounded-xl bg-neutral-50 px-3 py-2 text-caption">
        <div>
          <span className="text-neutral-500 font-medium">Mineral: </span>
          <span className="font-semibold text-ink">{item.mineralName}</span>
        </div>
        <div>
          <span className="text-neutral-500 font-medium">Qty: </span>
          <span className="tabular font-bold text-ink">{item.quantity}</span>
        </div>
      </div>

      {/* Bottom row: Purchased From + Chevron Arrow button */}
      <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 text-caption">
        <div className="flex items-center gap-1.5 text-neutral-600">
          <Store size={14} className="text-neutral-400 shrink-0" />
          <span className="text-[12px] truncate max-w-[200px] sm:max-w-[240px]">
            <span className="text-neutral-400 font-normal">From: </span>
            <span className="font-medium text-ink">{item.purchasedFrom || 'Authorized Stock Point'}</span>
          </span>
        </div>

        <div className="flex size-7 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-colors group-hover:bg-primary-50 group-hover:text-primary-700">
          <ChevronRight size={16} />
        </div>
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
  if (normalized.includes('ARRIV')) {
    return {
      label: 'Arrived at Site',
      className: 'bg-[#fef3c7] text-[#92400e]',
    };
  }
  if (normalized.includes('APPROV') || normalized.includes('PASS') || normalized === 'SCHEDULED' || normalized === 'DIGITP_CREATED') {
    return {
      label: 'Pass Issued',
      className: 'bg-[#e0f2fe] text-[#0369a1]',
    };
  }
  if (normalized.includes('DISCREP')) {
    return {
      label: 'Discrepancy Reported',
      className: 'bg-[#fee2e2] text-[#991b1b]',
    };
  }
  if (normalized.includes('DELIVER') || normalized.includes('RECEIV')) {
    return {
      label: 'Delivered & Verified',
      className: 'bg-[#dcfce7] text-[#15803d]',
    };
  }
  return {
    label: status,
    className: 'bg-neutral-100 text-neutral-700',
  };
}
