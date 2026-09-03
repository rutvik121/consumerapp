import { useState } from 'react';
import { ChevronDown, FileText, Pencil, Receipt } from 'lucide-react';
import type { Mineral } from '@/domain';
import { Checkbox, DetailList, type DetailItem } from '@/design-system';
import {
  calculateApplicationFeeBreakdown,
  DEMAND_NOTE_OFFICES,
  GRAS_OFFICES,
  PLOT_LOCATIONS,
  PROPOSAL_APPLICATION_TYPES,
  PROPOSAL_LEVELS,
  type ApplicationDraft,
  type ApplicationStep,
  formatMoney,
} from '@/rules';
import type { AttachedDocument } from '../DocumentChecklist';

export interface ReviewStepProps {
  draft: ApplicationDraft;
  errors: Record<string, string>;
  documents: AttachedDocument[];
  minerals: Mineral[];
  onDeclarationChange: (accepted: boolean) => void;
  onEdit: (step: ApplicationStep) => void;
}

/**
 * STEP 5 · REVIEW SUMMARY & APPLICATION FEE PAYMENT
 *
 * Full read-back of all desktop fields:
 * - Applicant Details & Tax/ID numbers
 * - Proposal type, Proposal level, Brass quantity, Lifting days, Reason
 * - Plot category, location, survey assignments, area in Ha, coordinates, Demand Note & GRAS offices
 * - Attached documents checklist
 * - Statutory declaration & calculated tiered application fee with collapsible breakdown
 */
export function ReviewStep({
  draft,
  errors = {},
  documents = [],
  minerals = [],
  onDeclarationChange,
  onEdit,
}: ReviewStepProps) {
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);

  const safeMinerals = Array.isArray(minerals) ? minerals : [];
  const safeDocs = Array.isArray(documents) ? documents : [];
  const safeDraft = draft || ({} as ApplicationDraft);

  const mineral = safeMinerals.find((m) => m.id === safeDraft.mineralId);
  const appType = PROPOSAL_APPLICATION_TYPES.find((t) => t.value === safeDraft.applicationType);
  const propLevel = PROPOSAL_LEVELS.find((l) => l.value === safeDraft.proposalLevel);
  const plotLoc = PLOT_LOCATIONS.find((p) => p.value === safeDraft.plotLocationType);
  const dmoOffice = DEMAND_NOTE_OFFICES.find((o) => o.value === safeDraft.demandNoteOffice);
  const grasOffice = GRAS_OFFICES.find((o) => o.value === safeDraft.grasOfficeName);

  const quantityBrass = safeDraft.excavationQuantityBrass ?? safeDraft.estimatedQuantity ?? 100;
  const feeBreakdown = calculateApplicationFeeBreakdown(quantityBrass);

  const applicant: DetailItem[] = [
    { label: 'Applicant Name', value: safeDraft.fullName || '—' },
    { label: 'Mobile No.', value: safeDraft.mobileNumber || '—', numeric: true },
    ...(safeDraft.landlineNumber ? [{ label: 'Landline No.', value: safeDraft.landlineNumber }] : []),
    { label: 'Email Id', value: safeDraft.email || '—' },
    { label: 'PAN Number', value: safeDraft.panNumber || '—', numeric: true },
    ...(safeDraft.aadhaarNumber ? [{ label: 'Aadhaar Number', value: safeDraft.aadhaarNumber, numeric: true }] : []),
    ...(safeDraft.gstNumber ? [{ label: 'GST Number', value: safeDraft.gstNumber, numeric: true }] : []),
    {
      label: 'Registered Address',
      value:
        `${safeDraft.registeredAddressLine || ''}, ${safeDraft.registeredTaluka || ''}, ${safeDraft.registeredDistrict || ''} — ${safeDraft.registeredPincode || ''}`
          .replace(/^[,\s—]+|[,\s—]+$/g, '') || '—',
    },
  ];

  const proposal: DetailItem[] = [
    { label: 'Application Type', value: appType?.label ?? safeDraft.applicationType ?? '—' },
    { label: 'Lease Type', value: 'Temporary' },
    { label: 'Proposal Level', value: propLevel?.label ?? safeDraft.proposalLevel ?? '—' },
    { label: 'Mineral', value: mineral?.name ?? '—' },
    {
      label: 'Excavation Quantity',
      value: safeDraft.excavationQuantityBrass
        ? `${safeDraft.excavationQuantityBrass} Brass`
        : safeDraft.estimatedQuantity
        ? `${safeDraft.estimatedQuantity} Brass`
        : '—',
      numeric: true,
    },
    {
      label: 'Lifting Period',
      value: safeDraft.liftingPeriodDays ? `${safeDraft.liftingPeriodDays} Days` : '—',
      numeric: true,
    },
    { label: 'Reason For Applying', value: safeDraft.reasonForApplying || '—' },
  ];

  const surveySummary =
    Array.isArray(safeDraft.surveyEntries) && safeDraft.surveyEntries.length > 0
      ? safeDraft.surveyEntries
          .map(
            (s) =>
              `Survey ${s.surveyNumber || '142/1'} (${
                s.sevenTwelveAttached ? '7/12 Verified' : 'Standard'
              })`
          )
          .join(', ')
      : safeDraft.surveyNumber || '—';

  const location: DetailItem[] = [
    { label: 'Category', value: safeDraft.category === 'RURAL' ? 'Rural' : 'Urban' },
    { label: 'Plot Location', value: plotLoc?.label ?? safeDraft.plotLocationType ?? '—' },
    { label: 'District', value: safeDraft.districtName || safeDraft.districtCode || '—' },
    { label: 'Taluka / CTSO', value: safeDraft.talukaName || safeDraft.talukaCode || '—' },
    { label: 'Village / City', value: safeDraft.villageName || safeDraft.villageCode || '—' },
    { label: 'Assigned Surveys', value: surveySummary, numeric: true },
    {
      label: 'Total Plot Area',
      value: `${safeDraft.totalPlotAreaHectare ?? '—'} Hectare (${(
        (safeDraft.totalPlotAreaHectare ?? 0) * 10000
      ).toLocaleString('en-IN')} sq m)`,
      numeric: true,
    },
    {
      label: 'Coordinates',
      value:
        safeDraft.siteGeo &&
        typeof safeDraft.siteGeo.latitude === 'number' &&
        typeof safeDraft.siteGeo.longitude === 'number'
          ? `${safeDraft.siteGeo.latitude.toFixed(5)}, ${safeDraft.siteGeo.longitude.toFixed(5)}`
          : '—',
      numeric: true,
    },
    { label: 'Office For Demand Note', value: dmoOffice?.label ?? safeDraft.demandNoteOffice ?? '—' },
    { label: 'GRAS Office Name', value: grasOffice?.label ?? safeDraft.grasOfficeName ?? '—' },
  ];

  return (
    <div className="space-y-5">
      <ReviewSection
        title="Applicant & Identity Details"
        items={applicant}
        onEdit={() => onEdit('APPLICANT')}
      />
      <ReviewSection
        title="Proposal & Excavation Details"
        items={proposal}
        onEdit={() => onEdit('EXCAVATION')}
      />
      <ReviewSection
        title="Plot, Survey & Treasury Offices"
        items={location}
        onEdit={() => onEdit('LOCATION')}
      />
      <ReviewSection
        title="Uploaded Documents"
        items={
          safeDocs.length === 0
            ? [{ label: 'Clearances', value: 'No documents attached (Can be submitted during review)' }]
            : safeDocs.map((doc) => ({
                label: doc.documentType || doc.kind,
                value: `${doc.fileName || 'document.pdf'} ${doc.documentNumber ? `(Ref: ${doc.documentNumber})` : ''}`,
              }))
        }
        onEdit={() => onEdit('DOCUMENTS')}
      />

      {/* Calculated Statutory Fee Card with Collapsible Breakdown */}
      <div className="rounded-xl border border-line bg-surface p-4 shadow-xs">
        <div className="flex items-center gap-1.5">
          <Receipt size={16} className="text-primary-700" />
          <h3 className="text-label font-bold text-ink">Application Fee Summary</h3>
        </div>

        <div className="mt-3 flex items-baseline justify-between border-t border-line/60 pt-3">
          <div>
            <span className="text-body font-semibold text-ink">Total Statutory Amount Payable</span>
            <p className="text-caption text-ink-muted">
              Computed for <strong>{quantityBrass} Brass</strong> via GRAS Cyber Treasury
            </p>
          </div>
          <span className="tabular text-title-lg font-bold text-primary-700">
            {formatMoney(feeBreakdown.totalFee)}
          </span>
        </div>

        {/* Collapsible Trigger */}
        <button
          type="button"
          onClick={() => setIsBreakdownOpen((prev) => !prev)}
          className="mt-3 flex w-full items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-caption font-semibold text-primary-700 hover:bg-neutral-100 transition-colors border border-neutral-200/60"
        >
          <span className="flex items-center gap-1.5">
            <FileText size={13} />
            {isBreakdownOpen ? 'Hide Fee Breakdown' : 'View Fee Breakdown'}
          </span>
          <ChevronDown
            size={15}
            className={`transition-transform duration-200 ${isBreakdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Collapsible Content */}
        {isBreakdownOpen && (
          <div className="mt-2.5 rounded-lg border border-neutral-200/90 bg-neutral-50/70 p-3 text-caption space-y-2 animate-fadeIn">
            <div className="flex justify-between items-center text-ink">
              <span className="text-neutral-600">Application Fee</span>
              <span className="font-semibold tabular">{formatMoney(feeBreakdown.baseFee)}</span>
            </div>

            <div className="flex justify-between items-center text-ink">
              <span className="text-neutral-600">Stamp Duty</span>
              <span className="font-semibold tabular">{formatMoney(feeBreakdown.stampDuty)}</span>
            </div>

            <div className="border-t border-dashed border-neutral-300 pt-2 flex justify-between items-center font-bold text-ink">
              <span>Total Payable Amount</span>
              <span className="text-primary-700 text-body-sm tabular">
                {formatMoney(feeBreakdown.totalFee)}
              </span>
            </div>
          </div>
        )}
      </div>

      <Checkbox
        checked={draft.declarationAccepted}
        onChange={onDeclarationChange}
        label="I solemnly declare that all particulars entered above are true, and the excavation will be executed strictly within permitted boundaries in compliance with the Maharashtra Minor Mineral Extraction Rules."
        {...(errors.declarationAccepted ? { error: errors.declarationAccepted } : {})}
      />
    </div>
  );
}

function ReviewSection({
  title,
  items,
  onEdit,
}: {
  title: string;
  items: DetailItem[];
  onEdit: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-neutral-50 px-4 py-2.5">
        <h3 className="text-label font-bold text-ink">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-caption font-semibold text-primary-700 hover:bg-primary-50 transition-colors"
        >
          <Pencil size={12} aria-hidden />
          Edit
        </button>
      </div>
      <DetailList items={items} />
    </section>
  );
}
