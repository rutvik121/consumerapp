import { Pencil } from 'lucide-react';
import type { Mineral } from '@/domain';
import { Checkbox, DetailList, type DetailItem } from '@/design-system';
import {
  APPLICATION_FEE,
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
 * - Statutory declaration & application fee
 */
export function ReviewStep({
  draft,
  errors,
  documents,
  minerals,
  onDeclarationChange,
  onEdit,
}: ReviewStepProps) {
  const mineral = minerals.find((m) => m.id === draft.mineralId);
  const appType = PROPOSAL_APPLICATION_TYPES.find((t) => t.value === draft.applicationType);
  const propLevel = PROPOSAL_LEVELS.find((l) => l.value === draft.proposalLevel);
  const plotLoc = PLOT_LOCATIONS.find((p) => p.value === draft.plotLocationType);
  const dmoOffice = DEMAND_NOTE_OFFICES.find((o) => o.value === draft.demandNoteOffice);
  const grasOffice = GRAS_OFFICES.find((o) => o.value === draft.grasOfficeName);

  const applicant: DetailItem[] = [
    { label: 'Applicant Name', value: draft.fullName },
    { label: 'Mobile No.', value: draft.mobileNumber, numeric: true },
    ...(draft.landlineNumber ? [{ label: 'Landline No.', value: draft.landlineNumber }] : []),
    { label: 'Email Id', value: draft.email || '—' },
    { label: 'PAN Number', value: draft.panNumber, numeric: true },
    ...(draft.aadhaarNumber ? [{ label: 'Aadhaar Number', value: draft.aadhaarNumber, numeric: true }] : []),
    ...(draft.gstNumber ? [{ label: 'GST Number', value: draft.gstNumber, numeric: true }] : []),
    {
      label: 'Registered Address',
      value: `${draft.registeredAddressLine}, ${draft.registeredTaluka}, ${draft.registeredDistrict} — ${draft.registeredPincode}`,
    },
  ];

  const proposal: DetailItem[] = [
    { label: 'Application Type', value: appType?.label ?? draft.applicationType },
    { label: 'Lease Type', value: 'Temporary' },
    { label: 'Proposal Level', value: propLevel?.label ?? draft.proposalLevel },
    { label: 'Mineral', value: mineral?.name ?? '—' },
    {
      label: 'Excavation Quantity',
      value: draft.excavationQuantityBrass ? `${draft.excavationQuantityBrass} Brass (~${Math.round(draft.excavationQuantityBrass * 4.5)} MT)` : '—',
      numeric: true,
    },
    {
      label: 'Lifting Period',
      value: draft.liftingPeriodDays ? `${draft.liftingPeriodDays} Days` : '—',
      numeric: true,
    },
    { label: 'Reason For Applying', value: draft.reasonForApplying || '—' },
  ];

  const surveySummary = draft.surveyEntries.length > 0
    ? draft.surveyEntries.map((s) => `Survey ${s.surveyNumber} (${s.sevenTwelveAttached ? '7/12 Verified' : 'Standard'})`).join(', ')
    : draft.surveyNumber;

  const location: DetailItem[] = [
    { label: 'Category', value: draft.category === 'RURAL' ? 'Rural' : 'Urban' },
    { label: 'Plot Location', value: plotLoc?.label ?? draft.plotLocationType },
    { label: 'District', value: draft.districtName || draft.districtCode || '—' },
    { label: 'Taluka / CTSO', value: draft.talukaName || draft.talukaCode || '—' },
    { label: 'Village / City', value: draft.villageName || draft.villageCode || '—' },
    { label: 'Assigned Surveys', value: surveySummary, numeric: true },
    {
      label: 'Total Plot Area',
      value: `${draft.totalPlotAreaHectare ?? '—'} Hectare (${(draft.totalPlotAreaHectare ?? 0) * 10000} sq m)`,
      numeric: true,
    },
    {
      label: 'Coordinates',
      value: draft.siteGeo
        ? `${draft.siteGeo.latitude.toFixed(5)}, ${draft.siteGeo.longitude.toFixed(5)}`
        : '—',
      numeric: true,
    },
    { label: 'Office For Demand Note', value: dmoOffice?.label ?? draft.demandNoteOffice },
    { label: 'GRAS Office Name', value: grasOffice?.label ?? draft.grasOfficeName },
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
          documents.length === 0
            ? [{ label: 'Clearances', value: 'No documents attached (Can be submitted during review)' }]
            : documents.map((doc) => ({
                label: doc.documentType,
                value: `${doc.fileName} ${doc.documentNumber ? `(Ref: ${doc.documentNumber})` : ''}`,
              }))
        }
        onEdit={() => onEdit('DOCUMENTS')}
      />

      <div className="rounded-xl border border-line bg-surface p-4 shadow-xs">
        <p className="text-label font-bold text-ink-secondary mb-2">
          Application Fee Summary
        </p>
        <div className="flex items-baseline justify-between border-t border-line/60 pt-3">
          <div>
            <span className="text-body font-semibold text-ink">Statutory Application Fee</span>
            <p className="text-caption text-ink-muted">Payable to Revenue Dept via GRAS Cyber Treasury</p>
          </div>
          <span className="tabular text-title-lg font-bold text-ink">{formatMoney(APPLICATION_FEE)}</span>
        </div>
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
