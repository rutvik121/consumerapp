import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, X } from 'lucide-react';
import {
  APPLICATION_STEPS,
  type ApplicationDraft,
  type ApplicationStep,
  validateApplicationStep,
} from '@/rules';
import {
  Button,
  ErrorState,
  Input,
  LoadingState,
  QuantityInput,
  Select,
  StepProgress,
  Surface,
  Textarea,
} from '@/design-system';
import { OrganizationContextBar, ROUTES, Screen } from '@/navigation';
import { mineralRepository, temporaryExcavationRepository, useAsync } from '@/data';
import { useCurrentOrganization, useOperatingContext } from '@/state';
import { useCopy } from '@/content';

interface AttachedDocument {
  documentType: string;
  fileName: string;
}

/**
 * NEW TEMPORARY EXCAVATION APPLICATION — ORGANIZATION ONLY.
 *
 * Three steps, grouped by the question each answers: where you will excavate,
 * what you will extract, and for how long with what evidence. A single form
 * carrying twelve fields would be the long, overwhelming form the UX
 * principles rule out.
 *
 * CONTEXT: project and package are attached from the operating context and
 * never asked for. An organization that reached this from a package is
 * applying for that package; one that did not is applying at organization
 * level. Adding a selector would ask for something already known in the first
 * case and invent a requirement in the second.
 *
 * PROVISIONAL (open question #5): this field list is a reasonable
 * excavation-permit shape, not a confirmed one.
 */
export function NewApplicationScreen() {
  const organization = useCurrentOrganization();
  const context = useOperatingContext();
  const navigate = useNavigate();
  const t = useCopy();

  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<AttachedDocument[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [draft, setDraft] = useState<ApplicationDraft>({
    mineralId: '',
    estimatedQuantity: null,
    purpose: '',
    surveyNumber: '',
    addressLine: '',
    taluka: '',
    district: '',
    pincode: '',
    areaInSqm: null,
    depthInMetres: null,
    fromDate: '',
    toDate: '',
  });

  const minerals = useAsync(() => mineralRepository.listAll(), []);
  const step: ApplicationStep = APPLICATION_STEPS[stepIndex] ?? 'SITE';
  const isLastStep = stepIndex === APPLICATION_STEPS.length - 1;

  function update<K extends keyof ApplicationDraft>(key: K, value: ApplicationDraft[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: '' }));
  }

  function next() {
    const found = validateApplicationStep(step, draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    if (!isLastStep) setStepIndex((index) => index + 1);
  }

  /**
   * Creates the application as a DRAFT and hands off to payment.
   *
   * Nothing is submitted here. Paying the application fee is what submits it,
   * so this screen's job ends at "there is now something to pay for".
   */
  async function persist(goToPayment: boolean) {
    const found = validateApplicationStep(step, draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    if (!organization || draft.estimatedQuantity === null) return;

    setSubmitting(true);
    try {
      const application = await temporaryExcavationRepository.create({
        organizationId: organization.id,
        // Attached from context, never asked for.
        ...(context?.projectId ? { projectId: context.projectId } : {}),
        ...(context?.packageId ? { packageId: context.packageId } : {}),
        mineralId: draft.mineralId,
        estimatedQuantity: { value: draft.estimatedQuantity, unit: 'MT' },
        purpose: draft.purpose.trim(),
        siteAddress: {
          line1: draft.addressLine.trim(),
          taluka: draft.taluka.trim(),
          district: draft.district.trim(),
          state: 'Maharashtra',
          pincode: draft.pincode.trim(),
        },
        surveyNumber: draft.surveyNumber.trim(),
        areaInSqm: draft.areaInSqm ?? 0,
        depthInMetres: draft.depthInMetres ?? 0,
        fromDate: draft.fromDate,
        toDate: draft.toDate,
        documents,
      });

      navigate(
        goToPayment
          ? ROUTES.applicationPayment(application.id, 'application-fee')
          : ROUTES.excavationApplication(application.id),
        { replace: true },
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen
      title={t.excavation.newApplication}
      onBack={() => (stepIndex === 0 ? navigate(-1) : setStepIndex((index) => index - 1))}
      context={<OrganizationContextBar showChange={false} />}
      footer={
        isLastStep ? (
          <div className="space-y-2">
            <Button size="lg" fullWidth loading={submitting} onClick={() => persist(true)}>
              {submitting ? t.excavation.submitting : t.excavation.payAndSubmit}
            </Button>
            <Button variant="ghost" fullWidth disabled={submitting} onClick={() => persist(false)}>
              {t.excavation.saveDraft}
            </Button>
          </div>
        ) : (
          <Button size="lg" fullWidth onClick={next}>
            {t.actions.continue}
          </Button>
        )
      }
    >
      {minerals.loading && <LoadingState variant="screen" />}
      {minerals.error && <ErrorState onRetry={minerals.reload} />}

      {minerals.data && (
        <>
          <div className="border-b border-line bg-surface px-4 py-3">
            <StepProgress current={stepIndex + 1} total={APPLICATION_STEPS.length} />
          </div>

          <div className="px-4 py-5">
            <h2 className="text-title-lg text-ink">
              {step === 'SITE'
                ? t.excavation.stepSite
                : step === 'EXCAVATION'
                  ? t.excavation.stepExcavation
                  : t.excavation.stepPeriod}
            </h2>
          </div>

          <Surface className="border-y border-line px-4 py-4">
            {step === 'SITE' && (
              <div className="space-y-4">
                <Input
                  label={t.excavation.surveyNumber}
                  required
                  autoFocus
                  placeholder="118/2"
                  value={draft.surveyNumber}
                  {...(errors.surveyNumber ? { error: errors.surveyNumber } : {})}
                  onChange={(event) => update('surveyNumber', event.target.value)}
                />
                <Input
                  label="Site address"
                  required
                  value={draft.addressLine}
                  {...(errors.addressLine ? { error: errors.addressLine } : {})}
                  onChange={(event) => update('addressLine', event.target.value)}
                />
                <div className="flex gap-3">
                  <Input
                    label="Taluka"
                    required
                    value={draft.taluka}
                    {...(errors.taluka ? { error: errors.taluka } : {})}
                    onChange={(event) => update('taluka', event.target.value)}
                  />
                  <Input
                    label="District"
                    required
                    value={draft.district}
                    {...(errors.district ? { error: errors.district } : {})}
                    onChange={(event) => update('district', event.target.value)}
                  />
                </div>
                <Input
                  label="PIN code"
                  required
                  inputMode="numeric"
                  maxLength={6}
                  value={draft.pincode}
                  {...(errors.pincode ? { error: errors.pincode } : {})}
                  onChange={(event) =>
                    update('pincode', event.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                />
              </div>
            )}

            {step === 'EXCAVATION' && (
              <div className="space-y-4">
                <Select
                  label={t.excavation.mineral}
                  required
                  placeholder="Select a mineral"
                  value={draft.mineralId}
                  options={minerals.data.map((mineral) => ({
                    value: mineral.id,
                    label: mineral.name,
                  }))}
                  {...(errors.mineralId ? { error: errors.mineralId } : {})}
                  onChange={(event) => update('mineralId', event.target.value)}
                />
                <QuantityInput
                  label={t.excavation.estimatedQuantity}
                  required
                  value={draft.estimatedQuantity}
                  unit="MT"
                  onChange={(value) => update('estimatedQuantity', value)}
                  {...(errors.estimatedQuantity ? { error: errors.estimatedQuantity } : {})}
                />
                <div className="flex gap-3">
                  <Input
                    label="Area (sq m)"
                    required
                    inputMode="decimal"
                    value={draft.areaInSqm ?? ''}
                    {...(errors.areaInSqm ? { error: errors.areaInSqm } : {})}
                    onChange={(event) =>
                      update('areaInSqm', event.target.value ? Number(event.target.value) : null)
                    }
                  />
                  <Input
                    label="Depth (m)"
                    required
                    inputMode="decimal"
                    value={draft.depthInMetres ?? ''}
                    {...(errors.depthInMetres ? { error: errors.depthInMetres } : {})}
                    onChange={(event) =>
                      update('depthInMetres', event.target.value ? Number(event.target.value) : null)
                    }
                  />
                </div>
                <Textarea
                  label={t.excavation.purpose}
                  required
                  placeholder="What the excavated mineral will be used for"
                  value={draft.purpose}
                  {...(errors.purpose ? { error: errors.purpose } : {})}
                  onChange={(event) => update('purpose', event.target.value)}
                />
              </div>
            )}

            {step === 'PERIOD' && (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    label={t.excavation.from}
                    required
                    type="date"
                    value={draft.fromDate}
                    {...(errors.fromDate ? { error: errors.fromDate } : {})}
                    onChange={(event) => update('fromDate', event.target.value)}
                  />
                  <Input
                    label={t.excavation.to}
                    required
                    type="date"
                    value={draft.toDate}
                    {...(errors.toDate ? { error: errors.toDate } : {})}
                    onChange={(event) => update('toDate', event.target.value)}
                  />
                </div>

                <div>
                  <p className="mb-2 text-label text-ink-secondary">{t.excavation.documents}</p>

                  {documents.length > 0 && (
                    <ul className="mb-3 space-y-2">
                      {documents.map((document, index) => (
                        <li
                          key={`${document.documentType}-${index}`}
                          className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2"
                        >
                          <FileText size={15} className="shrink-0 text-ink-muted" aria-hidden />
                          <span className="min-w-0 flex-1 truncate text-body-sm text-ink">
                            {document.documentType}
                          </span>
                          <button
                            type="button"
                            aria-label={`Remove ${document.documentType}`}
                            onClick={() =>
                              setDocuments((all) => all.filter((_, position) => position !== index))
                            }
                            className="flex size-7 items-center justify-center rounded-full text-ink-muted hover:bg-neutral-100"
                          >
                            <X size={14} aria-hidden />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* ==== PROTOTYPE ONLY — a real build opens a file picker ==== */}
                  <Select
                    label=""
                    placeholder={t.excavation.attachDocument}
                    value=""
                    options={Object.entries(t.excavation.docTypes).map(([key, label]) => ({
                      value: key,
                      label,
                    }))}
                    onChange={(event) => {
                      const key = event.target.value as keyof typeof t.excavation.docTypes;
                      if (!key) return;
                      setDocuments((all) => [
                        ...all,
                        {
                          documentType: t.excavation.docTypes[key],
                          fileName: `${key.toLowerCase()}.pdf`,
                        },
                      ]);
                    }}
                  />
                  <p className="mt-1.5 text-caption text-ink-muted">
                    Attachment is simulated in this prototype.
                  </p>
                  {/* ==== end prototype block ==== */}
                </div>
              </div>
            )}
          </Surface>
        </>
      )}
    </Screen>
  );
}
