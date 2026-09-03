import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Download,
  FileCheck,
  FileText,
  IndianRupee,
  MapPin,
  Plus,
  Search,
  Shovel,
} from 'lucide-react';
import type { ID, TemporaryExcavationApplication } from '@/domain';
import {
  awaitsDemandNotePayment,
  formatMoney,
  formatQuantity,
  hasExcavationOrder,
  needsApplicantResponse,
  statusPresentation,
} from '@/rules';
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
  cn,
} from '@/design-system';
import { ROUTES, Screen } from '@/navigation';
import { mineralRepository, temporaryExcavationRepository, useAsync } from '@/data';
import { useCurrentOrganization } from '@/state';
import { useCopy } from '@/content';

type FilterTab = 'ALL' | 'UNDER_REVIEW' | 'DEMAND_NOTE' | 'PERMIT_ISSUED' | 'ATTENTION';

export function TemporaryExcavationScreen() {
  const organization = useCurrentOrganization();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const t = useCopy();

  const filterParam = searchParams.get('filter') as FilterTab | null;
  const [activeTab, setActiveTab] = useState<FilterTab>(filterParam || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (filterParam) {
      setActiveTab(filterParam);
    }
  }, [filterParam]);

  const query = useAsync(async () => {
    const [applications, minerals] = await Promise.all([
      temporaryExcavationRepository.listByOrganization(organization?.id || 'org-001'),
      mineralRepository.listAll(),
    ]);

    return { applications, minerals };
  }, [organization?.id]);

  const applications = query.data?.applications ?? [];
  const minerals = query.data?.minerals ?? [];
  const mineralName = (id: ID) =>
    minerals.find((mineral) => mineral.id === id)?.name ?? 'Minor Mineral';

  const isUnderReviewCategory = (app: TemporaryExcavationApplication) =>
    app.status === 'UNDER_REVIEW' || app.status === 'QUERY_RAISED' || app.status === 'DRAFT';

  // Counts for Top 4 Summary Cards & Chips
  const totalCount = applications.length;
  const underReviewCount = applications.filter(isUnderReviewCategory).length;
  const demandNoteCount = applications.filter(
    (a) => a.status === 'DEMAND_NOTE_ISSUED'
  ).length;
  const permitIssuedCount = applications.filter(
    (a) => a.status === 'ORDER_ISSUED'
  ).length;
  const attentionCount = applications.filter(
    (app) => needsApplicantResponse(app) || awaitsDemandNotePayment(app)
  ).length;

  // Filtered List
  const filteredApplications = applications.filter((app) => {
    // Tab filter
    if (activeTab === 'UNDER_REVIEW' && !isUnderReviewCategory(app)) return false;
    if (activeTab === 'DEMAND_NOTE' && app.status !== 'DEMAND_NOTE_ISSUED') return false;
    if (activeTab === 'PERMIT_ISSUED' && app.status !== 'ORDER_ISSUED') return false;
    if (activeTab === 'ATTENTION' && !needsApplicantResponse(app) && !awaitsDemandNotePayment(app)) return false;

    // Search query
    if (searchQuery.trim()) {
      const qLower = searchQuery.toLowerCase();
      const minName = mineralName(app.mineralId).toLowerCase();
      const matchesNo = app.applicationNumber.toLowerCase().includes(qLower);
      const matchesSurvey = app.surveyNumber.toLowerCase().includes(qLower);
      const matchesVillage = app.village.toLowerCase().includes(qLower);
      const matchesTaluka = app.siteAddress.taluka.toLowerCase().includes(qLower);
      const matchesMineral = minName.includes(qLower);
      if (!matchesNo && !matchesSurvey && !matchesVillage && !matchesTaluka && !matchesMineral) {
        return false;
      }
    }

    return true;
  });

  return (
    <Screen
      title="Temporary Excavation"
      onBack
      footer={
        <Button
          size="lg"
          fullWidth
          leftIcon={<Plus size={16} />}
          onClick={() => navigate(ROUTES.newExcavationApplication)}
        >
          {t.excavation.newApplication}
        </Button>
      }
    >
      {query.loading && <LoadingState variant="list" rows={4} />}
      {query.error && <ErrorState onRetry={query.reload} />}

      {query.data && (
        <div className="space-y-4 bg-[#f8fafc] px-4 py-4 pb-12">
          {/* 1. Top 4 Summary Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Card 1: Total Applied */}
            <div
              onClick={() => setActiveTab('ALL')}
              className={cn(
                'cursor-pointer rounded-2xl border p-3.5 shadow-xs transition-all active:scale-95',
                activeTab === 'ALL'
                  ? 'border-[#134280] bg-[#eef5fd] ring-2 ring-[#134280]/20'
                  : 'border-[#d6e5f8] bg-[#f8fafc] hover:bg-[#eef5fd]/60'
              )}
            >
              <div className="flex items-center justify-between text-[#134280]">
                <span className="text-caption font-semibold">Total Applied</span>
                <FileText size={15} />
              </div>
              <p className="mt-1 text-2xl font-bold tracking-tight text-[#134280]">
                {String(totalCount).padStart(2, '0')}
              </p>
              <p className="mt-0.5 text-[11px] text-neutral-500">All submitted permits</p>
            </div>

            {/* Card 2: Under Review */}
            <div
              onClick={() => setActiveTab('UNDER_REVIEW')}
              className={cn(
                'cursor-pointer rounded-2xl border p-3.5 shadow-xs transition-all active:scale-95',
                activeTab === 'UNDER_REVIEW'
                  ? 'border-[#b45309] bg-[#fef9e7] ring-2 ring-[#b45309]/20'
                  : 'border-[#fce8b2] bg-[#fdfaf3] hover:bg-[#fef9e7]/60'
              )}
            >
              <div className="flex items-center justify-between text-[#b45309]">
                <span className="text-caption font-semibold">Under Review</span>
                <Clock size={15} />
              </div>
              <p className="mt-1 text-2xl font-bold tracking-tight text-[#b45309]">
                {String(underReviewCount).padStart(2, '0')}
              </p>
              <p className="mt-0.5 text-[11px] text-neutral-500">With Mining Officer</p>
            </div>

            {/* Card 3: Pending Demand Note */}
            <div
              onClick={() => setActiveTab('DEMAND_NOTE')}
              className={cn(
                'cursor-pointer rounded-2xl border p-3.5 shadow-xs transition-all active:scale-95',
                activeTab === 'DEMAND_NOTE'
                  ? 'border-[#0f766e] bg-[#f0fdfa] ring-2 ring-[#0f766e]/20'
                  : 'border-[#99f6e4] bg-[#f0fdfa]/40 hover:bg-[#f0fdfa]'
              )}
            >
              <div className="flex items-center justify-between text-[#0f766e]">
                <span className="text-caption font-semibold">Demand Note Due</span>
                <IndianRupee size={15} />
              </div>
              <p className="mt-1 text-2xl font-bold tracking-tight text-[#0f766e]">
                {String(demandNoteCount).padStart(2, '0')}
              </p>
              <p className="mt-0.5 text-[11px] text-neutral-500">Royalty payment due</p>
            </div>

            {/* Card 4: Permit Issued */}
            <div
              onClick={() => setActiveTab('PERMIT_ISSUED')}
              className={cn(
                'cursor-pointer rounded-2xl border p-3.5 shadow-xs transition-all active:scale-95',
                activeTab === 'PERMIT_ISSUED'
                  ? 'border-[#15803d] bg-[#dcfce7] ring-2 ring-[#15803d]/20'
                  : 'border-[#bbf7d0] bg-[#f0fdf4] hover:bg-[#dcfce7]/60'
              )}
            >
              <div className="flex items-center justify-between text-[#15803d]">
                <span className="text-caption font-semibold">Permit Issued</span>
                <FileCheck size={15} />
              </div>
              <p className="mt-1 text-2xl font-bold tracking-tight text-[#15803d]">
                {String(permitIssuedCount).padStart(2, '0')}
              </p>
              <p className="mt-0.5 text-[11px] text-neutral-500">Active & extracted</p>
            </div>
          </div>

          {/* 2. Horizontal Filter Chips (No visible scrollbar) */}
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-1 text-caption font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 transition-all',
                activeTab === 'ALL'
                  ? 'bg-[#1241a6] text-white shadow-xs'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
              )}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('UNDER_REVIEW')}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 transition-all',
                activeTab === 'UNDER_REVIEW'
                  ? 'bg-[#1241a6] text-white shadow-xs'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
              )}
            >
              Under Review ({underReviewCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('DEMAND_NOTE')}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 transition-all',
                activeTab === 'DEMAND_NOTE'
                  ? 'bg-[#1241a6] text-white shadow-xs'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
              )}
            >
              Demand Note Due ({demandNoteCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PERMIT_ISSUED')}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 transition-all',
                activeTab === 'PERMIT_ISSUED'
                  ? 'bg-[#1241a6] text-white shadow-xs'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
              )}
            >
              Permits Issued ({permitIssuedCount})
            </button>
              <button
                type="button"
                onClick={() => setActiveTab('ATTENTION')}
                className={cn(
                  'shrink-0 rounded-full px-3.5 py-1.5 transition-all flex items-center gap-1',
                  activeTab === 'ATTENTION'
                    ? 'bg-[#b45309] text-white shadow-xs'
                    : 'bg-amber-50 text-[#b45309] border border-amber-200 hover:bg-amber-100'
                )}
              >
                <AlertTriangle size={12} />
                <span>Action Needed ({attentionCount})</span>
              </button>
          </div>

          {/* 3. Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input
              type="text"
              placeholder="Search by application no, survey no, mineral, village..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-9 pr-4 text-body-sm text-ink placeholder-neutral-400 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* 4. Applications List with Status Stepper */}
          {filteredApplications.length === 0 ? (
            <EmptyState
              icon={<Shovel size={22} />}
              title="No applications found"
              description={
                searchQuery
                  ? 'No applications match your search query. Try clearing the filter.'
                  : 'There are no excavation applications under this category.'
              }
            />
          ) : (
            <div className="space-y-3.5">
              {filteredApplications.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  mineralTitle={mineralName(app.mineralId)}
                  onClick={() => navigate(ROUTES.excavationApplication(app.id))}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Screen>
  );
}

/**
 * Modern Application Card with embedded multi-stage progress bar
 */
function ApplicationCard({
  application,
  mineralTitle,
  onClick,
}: {
  application: TemporaryExcavationApplication;
  mineralTitle: string;
  onClick: () => void;
}) {
  const navigate = useNavigate();
  const status = statusPresentation.temporaryExcavation(application.status);

  // Derive stage brief for clean concise preview on card
  let stageBrief = {
    title: 'Stage 1: Application Submitted',
    description: 'Application fee of ₹1,000 paid. Ready for departmental review.',
  };

  if (application.status === 'DRAFT') {
    stageBrief = {
      title: 'Stage 1: Draft Application',
      description: 'Application fee of ₹1,000 pending payment to submit.',
    };
  } else if (application.status === 'UNDER_REVIEW') {
    stageBrief = {
      title: 'Stage 2: Under Department Review',
      description: 'Site boundary inspection and verification in progress by Mining Officer.',
    };
  } else if (application.status === 'QUERY_RAISED') {
    stageBrief = {
      title: 'Stage 2: Action Required',
      description: application.statusRemarks || 'Revised survey plan or boundary clarification requested.',
    };
  } else if (application.status === 'DEMAND_NOTE_ISSUED') {
    stageBrief = {
      title: 'Stage 3: Demand Note Issued',
      description: `Royalty calculation complete. Challan payment of ${formatMoney(application.demandNote?.totalAmount || { amount: 268800, currency: 'INR' })} due.`,
    };
  } else if (application.status === 'ORDER_ISSUED') {
    stageBrief = {
      title: 'Stage 4: Permit Granted',
      description: 'Official excavation order issued. Transport permits & DigiTP authorized.',
    };
  }

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs transition-all hover:border-primary-400 hover:shadow-md active:scale-[0.99]"
    >
      {/* Header: App Number & Status Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="flex size-6 items-center justify-center rounded-md bg-[#eef4fe] text-[#1241a6]">
            <FileText size={14} />
          </span>
          <span className="font-mono text-body-sm font-bold text-ink">
            {application.applicationNumber}
          </span>
        </div>
        <StatusBadge label={status.label} tone={status.tone} size="sm" />
      </div>

      {/* Mineral & Quantity */}
      <div className="mt-2.5 flex items-baseline justify-between rounded-xl bg-neutral-50 px-3 py-2 text-caption">
        <div>
          <span className="text-neutral-500">Mineral: </span>
          <span className="font-semibold text-ink">{mineralTitle}</span>
        </div>
        <div>
          <span className="text-neutral-500">Volume: </span>
          <span className="tabular font-bold text-ink">
            {formatQuantity(application.estimatedQuantity)}
          </span>
        </div>
      </div>

      {/* Land & Site Location */}
      <div className="mt-2 space-y-1 text-caption text-neutral-600">
        <div className="flex items-center gap-1.5">
          <MapPin size={13} className="text-neutral-400 shrink-0" />
          <span className="truncate">
            Survey No. <strong>{application.surveyNumber}</strong>, {application.village}, {application.siteAddress.taluka}
          </span>
        </div>
      </div>

      {/* Concise Stage Brief Box */}
      <div className="mt-3 rounded-xl border border-neutral-100 bg-[#f8fafc] p-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            Current Stage
          </span>
          <span
            className={cn(
              'text-[11px] font-bold',
              application.status === 'ORDER_ISSUED'
                ? 'text-emerald-700'
                : application.status === 'DEMAND_NOTE_ISSUED'
                ? 'text-emerald-700'
                : application.status === 'QUERY_RAISED'
                ? 'text-amber-700'
                : 'text-[#1241a6]'
            )}
          >
            {stageBrief.title}
          </span>
        </div>
        <p className="mt-1 text-[12px] text-neutral-600 leading-snug">
          {stageBrief.description}
        </p>
      </div>

      {/* Action footer button / pill */}
      <div className="mt-3.5 flex items-center justify-between pt-2 border-t border-neutral-100 flex-wrap gap-2">
        <span className="text-[11px] text-neutral-400">
          Updated: {application.statusUpdatedAt ? new Date(application.statusUpdatedAt).toLocaleDateString('en-IN') : 'Recent'}
        </span>

        <div className="flex items-center gap-1.5 flex-wrap">
          {hasExcavationOrder(application) ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#15803d] bg-[#dcfce7] px-2.5 py-1 rounded-lg border border-[#86efac]">
              <Download size={12} />
              <span>Permit Ready (Ordnrno-04/08/2026-1)</span>
            </span>
          ) : awaitsDemandNotePayment(application) && application.demandNote ? (
            <button
              type="button"
              style={{ backgroundColor: '#15803d', color: '#ffffff' }}
              className="inline-flex items-center gap-1 rounded-lg py-1 px-3 text-[11px] font-bold text-white shadow-xs transition-all active:scale-95 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                navigate(ROUTES.applicationPayment(application.id, 'demand-note'));
              }}
            >
              <IndianRupee size={12} className="text-white" />
              <span className="text-white">Pay Demand Note ({formatMoney(application.demandNote.totalAmount)})</span>
            </button>
          ) : needsApplicantResponse(application) ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              <AlertTriangle size={12} />
              <span>Respond to Query</span>
            </span>
          ) : application.status !== 'DRAFT' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1241a6] bg-[#eef4fe] px-2 py-0.5 rounded-lg border border-[#bfd5fb]">
              <FileText size={11} />
              <span>DM-244 Paid</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-700 hover:text-primary-900">
              <span>View Details</span>
              <ArrowRight size={12} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
