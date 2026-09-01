import { Pencil } from 'lucide-react';
import type { Mineral } from '@/domain';
import { Checkbox, DetailList, type DetailItem } from '@/design-system';
import {
  APPLICATION_FEE,
  type ApplicationDraft,
  type ApplicationStep,
  formatMoney,
} from '@/rules';
import { useCopy } from '@/content';
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
 * STEP 5 · READ IT BACK, THEN DECLARE.
 *
 * Everything entered, grouped exactly as it was asked, with an edit affordance
 * per group that returns to the step that owns it. A review screen that cannot
 * be acted on is a wall of text: if the applicant spots a wrong depth here,
 * the fix has to be one tap away, not a five-tap walk backwards.
 *
 * The declaration and the fee sit together at the bottom because they are the
 * same moment — accepting the statement is what makes paying meaningful, and
 * paying is what submits the application.
 */
export function ReviewStep({
  draft,
  errors,
  documents,
  minerals,
  onDeclarationChange,
  onEdit,
}: ReviewStepProps) {
  const t = useCopy();
  const mineral = minerals.find((candidate) => candidate.id === draft.mineralId);

  const applicant: DetailItem[] = [
    { label: t.excavation.applicantName, value: draft.fullName },
    { label: t.excavation.applicantMobile, value: draft.mobileNumber, numeric: true },
    ...(draft.email ? [{ label: t.excavation.applicantEmail, value: draft.email }] : []),
    ...(draft.idProofType
      ? [
          {
            label: t.excavation.idProofTypes[draft.idProofType],
            value: draft.idProofNumber,
            numeric: true,
          },
        ]
      : []),
    {
      label: t.excavation.registeredAddress,
      value: `${draft.registeredAddressLine}, ${draft.registeredTaluka}, ${draft.registeredDistrict} — ${draft.registeredPincode}`,
    },
  ];

  const excavation: DetailItem[] = [
    { label: t.excavation.mineral, value: mineral?.name ?? '—' },
    {
      label: t.excavation.estimatedQuantity,
      value: draft.estimatedQuantity === null ? '—' : `${draft.estimatedQuantity} MT`,
      numeric: true,
    },
    ...(draft.excavationMethod
      ? [
          {
            label: t.excavation.excavationMethod,
            value: t.excavation.excavationMethods[draft.excavationMethod],
          },
        ]
      : []),
    { label: t.excavation.purpose, value: draft.purpose },
    ...(draft.remarks ? [{ label: t.excavation.remarks, value: draft.remarks }] : []),
  ];

  const location: DetailItem[] = [
    { label: t.excavation.village, value: draft.villageName },
    { label: t.excavation.taluka, value: draft.talukaName },
    { label: t.excavation.district, value: draft.districtName },
    { label: t.excavation.surveyNumber, value: draft.surveyNumber, numeric: true },
    ...(draft.subDivisionNumber
      ? [{ label: t.excavation.subDivisionNumber, value: draft.subDivisionNumber, numeric: true }]
      : []),
    ...(draft.landType
      ? [{ label: t.excavation.landType, value: t.excavation.landTypes[draft.landType] }]
      : []),
    { label: t.excavation.area, value: `${draft.areaInSqm ?? '—'} sq m`, numeric: true },
    {
      label: t.excavation.siteAddressLabel,
      value: `${draft.addressLine} — ${draft.pincode}`,
    },
    {
      label: t.excavation.coordinates,
      value: draft.siteGeo
        ? `${draft.siteGeo.latitude.toFixed(5)}, ${draft.siteGeo.longitude.toFixed(5)}`
        : '—',
      numeric: true,
    },
  ];

  return (
    <div className="space-y-5">
      <ReviewSection
        title={t.excavation.applicant}
        items={applicant}
        onEdit={() => onEdit('APPLICANT')}
      />
      <ReviewSection
        title={t.excavation.excavationDetails}
        items={excavation}
        onEdit={() => onEdit('EXCAVATION')}
      />
      <ReviewSection
        title={t.excavation.site}
        items={location}
        onEdit={() => onEdit('LOCATION')}
      />
      <ReviewSection
        title={t.excavation.documents}
        items={
          documents.length === 0
            ? [{ label: t.excavation.documents, value: t.excavation.noDocuments }]
            : documents.map((document) => ({
                label: document.documentType,
                value: document.fileName,
              }))
        }
        onEdit={() => onEdit('DOCUMENTS')}
      />

      <div className="rounded-lg border border-line-strong bg-surface">
        <p className="border-b border-line px-4 py-2.5 text-label text-ink-secondary">
          {t.excavation.paymentSummary}
        </p>
        <div className="flex items-baseline justify-between gap-4 px-4 py-3">
          <span className="text-body text-ink">{t.excavation.applicationFee}</span>
          <span className="tabular text-title-lg text-ink">{formatMoney(APPLICATION_FEE)}</span>
        </div>
        <p className="border-t border-line px-4 py-2.5 text-caption text-ink-muted">
          {t.excavation.feeNote}
        </p>
      </div>

      <Checkbox
        checked={draft.declarationAccepted}
        onChange={onDeclarationChange}
        label={t.excavation.declarationText}
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
  const t = useCopy();

  return (
    <section className="overflow-hidden rounded-lg border border-line-strong bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <h3 className="text-label text-ink-secondary">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1 rounded px-1 py-0.5 text-caption text-primary-600 hover:bg-primary-50"
        >
          <Pencil size={12} aria-hidden />
          {t.excavation.editStep}
        </button>
      </div>
      <DetailList items={items} />
    </section>
  );
}

