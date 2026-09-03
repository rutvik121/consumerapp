import { useState } from 'react';
import {
  Download,
  FileCheck,
  Search,
  Store,
  TrendingUp,
} from 'lucide-react';
import { cn, Button } from '@/design-system';
import { Screen } from '@/navigation';
import { DigiTpPassModal } from '../orders/DigiTpPassModal';

interface DigiTpReportItem {
  id: string;
  digiTpNumber: string;
  date: string;
  supplier: string;
  projectName: string;
  mineralName: string;
  quantity: string;
  status: 'DELIVERED' | 'IN_TRANSIT' | 'COMPLETED';
}

const REPORT_ITEMS: DigiTpReportItem[] = [
  {
    id: 'rep-1',
    digiTpNumber: 'DTP-2024-8842',
    date: 'Today, 09:30 AM',
    supplier: 'Shree Ganesh Stone Quarry',
    projectName: 'NH-48 Road Widening Site',
    mineralName: 'Basalt Stone',
    quantity: '500 Brass',
    status: 'IN_TRANSIT',
  },
  {
    id: 'rep-2',
    digiTpNumber: 'DTP-2024-7931',
    date: 'Yesterday, 04:15 PM',
    supplier: 'Krishna River Sand Depo',
    projectName: 'Coastal Highway Bridge Site',
    mineralName: 'River Sand',
    quantity: '200 Brass',
    status: 'DELIVERED',
  },
  {
    id: 'rep-3',
    digiTpNumber: 'DTP-2024-6420',
    date: '28 Aug 2024',
    supplier: 'Sahyadri Aggregate Hub',
    projectName: 'NH-48 Road Widening Site',
    mineralName: 'Stone Aggregate',
    quantity: '150 Brass',
    status: 'DELIVERED',
  },
  {
    id: 'rep-4',
    digiTpNumber: 'DTP-2024-5119',
    date: '24 Aug 2024',
    supplier: 'Pragati Mines & Minerals',
    projectName: 'Metro Pillar Section 4',
    mineralName: 'Murum / Earth',
    quantity: '350 Brass',
    status: 'COMPLETED',
  },
];

export function ConsumerReportsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<'30D' | '90D' | 'FY'>('30D');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<DigiTpReportItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredReports = REPORT_ITEMS.filter((item) =>
    item.digiTpNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.mineralName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.projectName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Screen title="Reports & Statements" onBack>
      {/* DigiTP Modal View */}
      <DigiTpPassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customData={
          selectedReport
            ? {
                digiTpNumber: selectedReport.digiTpNumber,
                plotName: selectedReport.supplier,
                destination: selectedReport.projectName,
                mineralType: selectedReport.mineralName,
                quantity: selectedReport.quantity,
                createdAt: selectedReport.date,
                vehicleNumber:
                  selectedReport.digiTpNumber === 'DTP-2024-8842'
                    ? 'MH-15-BN-4402'
                    : selectedReport.digiTpNumber === 'DTP-2024-7931'
                    ? 'MH-12-DE-9104'
                    : 'MH-14-GH-3021',
                driverName:
                  selectedReport.digiTpNumber === 'DTP-2024-8842'
                    ? 'Nitin Wagh'
                    : 'Sachin Patil',
                driverMobile:
                  selectedReport.digiTpNumber === 'DTP-2024-8842'
                    ? '9689330214'
                    : '9822451098',
              }
            : undefined
        }
      />

      <div className="space-y-5 bg-[#f8fafc] px-4 py-4 pb-12">
        {/* Period Selector & Download Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center rounded-xl bg-neutral-200/70 p-1 text-caption font-semibold">
            <button
              type="button"
              onClick={() => setSelectedPeriod('30D')}
              className={cn(
                'rounded-lg px-3 py-1.5 transition-all',
                selectedPeriod === '30D' ? 'bg-white text-ink shadow-xs' : 'text-neutral-600 hover:text-ink'
              )}
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod('90D')}
              className={cn(
                'rounded-lg px-3 py-1.5 transition-all',
                selectedPeriod === '90D' ? 'bg-white text-ink shadow-xs' : 'text-neutral-600 hover:text-ink'
              )}
            >
              Quarterly
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod('FY')}
              className={cn(
                'rounded-lg px-3 py-1.5 transition-all',
                selectedPeriod === 'FY' ? 'bg-white text-ink shadow-xs' : 'text-neutral-600 hover:text-ink'
              )}
            >
              FY 2024-25
            </button>
          </div>

          <Button
            size="sm"
            variant="secondary"
            className="flex items-center gap-1.5 border-primary-300 text-primary-800 bg-white"
            onClick={() => alert('Downloading DigiTP statement (PDF)...')}
          >
            <Download size={14} />
            <span>Export</span>
          </Button>
        </div>

        {/* KPI Overview Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[#d6e5f8] bg-[#eef5fd] p-4 shadow-xs">
            <div className="flex items-center justify-between text-[#134280]">
              <span className="text-caption font-medium">Total Received</span>
              <TrendingUp size={16} />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-[#134280]">
              1,200 <span className="text-body-sm font-semibold">Brass</span>
            </p>
            <p className="mt-0.5 text-[11px] text-neutral-500">Across 4 registered projects</p>
          </div>

          <div className="rounded-2xl border border-[#ebd9fb] bg-[#f7f0fd] p-4 shadow-xs">
            <div className="flex items-center justify-between text-[#7e22ce]">
              <span className="text-caption font-medium">DigiTP Issued</span>
              <FileCheck size={16} />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-[#7e22ce]">
              18 <span className="text-body-sm font-semibold">Passes</span>
            </p>
            <p className="mt-0.5 text-[11px] text-neutral-500">100% verified transit</p>
          </div>
        </div>

        {/* Mineral Category Breakdown */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-caption font-bold tracking-wider text-neutral-500 uppercase">
              Mineral Procurement Breakdown
            </h3>
            <span className="text-[11px] text-neutral-400">By volume (Brass)</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-body-sm font-medium">
                <span className="text-ink">Basalt Stone</span>
                <span className="tabular font-bold text-ink">500 Brass (41.6%)</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full rounded-full bg-[#1241a6]" style={{ width: '41.6%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-body-sm font-medium">
                <span className="text-ink">Murum / Earth</span>
                <span className="tabular font-bold text-ink">350 Brass (29.2%)</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full rounded-full bg-[#0284c7]" style={{ width: '29.2%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-body-sm font-medium">
                <span className="text-ink">River Sand</span>
                <span className="tabular font-bold text-ink">200 Brass (16.7%)</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full rounded-full bg-[#f59e0b]" style={{ width: '16.7%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-body-sm font-medium">
                <span className="text-ink">Stone Aggregate</span>
                <span className="tabular font-bold text-ink">150 Brass (12.5%)</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div className="h-full rounded-full bg-[#8b5cf6]" style={{ width: '12.5%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* DigiTP Transit Pass Statement List */}
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <h3 className="text-caption font-bold tracking-wider text-neutral-500 uppercase">
              DigiTP Transit Pass Registry
            </h3>
            <span className="text-caption font-medium text-neutral-500">
              {filteredReports.length} records
            </span>
          </div>

          {/* Search bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input
              type="text"
              placeholder="Search by DigiTP No, supplier, mineral..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-9 pr-4 text-body-sm text-ink placeholder-neutral-400 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Records List */}
          <div className="space-y-3">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs transition-all hover:border-primary-300"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="flex size-6 items-center justify-center rounded-md bg-[#eef4fe] text-[#1241a6]">
                      <FileCheck size={14} />
                    </span>
                    <span className="text-body-sm font-bold text-[#1241a6]">
                      DigiTP No: <span className="font-mono text-ink">{report.digiTpNumber}</span>
                    </span>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      report.status === 'IN_TRANSIT'
                        ? 'bg-[#f4eafc] text-[#7e22ce]'
                        : 'bg-[#dcfce7] text-[#15803d]'
                    )}
                  >
                    {report.status === 'IN_TRANSIT' ? 'In Transit' : 'Delivered'}
                  </span>
                </div>

                <div className="mt-2 text-caption">
                  <p className="font-bold text-ink">{report.projectName}</p>
                  <p className="text-neutral-500 text-[11px]">{report.date}</p>
                </div>

                <div className="mt-2.5 flex items-baseline justify-between rounded-xl bg-neutral-50 px-3 py-2 text-caption">
                  <div>
                    <span className="text-neutral-500">Mineral: </span>
                    <span className="font-semibold text-ink">{report.mineralName}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Quantity: </span>
                    <span className="tabular font-bold text-ink">{report.quantity}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2.5 text-caption">
                  <div className="flex items-center gap-1.5 text-neutral-600">
                    <Store size={13} className="text-neutral-400 shrink-0" />
                    <span className="text-[11px] truncate max-w-[180px]">
                      From: <span className="font-medium text-ink">{report.supplier}</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReport(report);
                      setIsModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#eef4fe] px-2.5 py-1 text-[11px] font-bold text-[#1241a6] hover:bg-primary-100 transition-colors"
                  >
                    <FileCheck size={12} />
                    <span>View DigiTP</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Screen>
  );
}
