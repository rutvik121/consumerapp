import { useNavigate } from 'react-router-dom';
import { Button, ErrorState, LoadingState, StepProgress, Surface } from '@/design-system';
import { OrganizationContextBar, Screen } from '@/navigation';
import { mineralRepository, useAsync } from '@/data';
import { useCurrentOrganization, useCurrentUser, useOperatingContext } from '@/state';
import { useCopy } from '@/content';
import { useApplicationForm } from './useApplicationForm';
import { ApplicantStep } from './steps/ApplicantStep';
import { ExcavationStep } from './steps/ExcavationStep';
import { LocationStep } from './steps/LocationStep';
import { DocumentsStep } from './steps/DocumentsStep';
import { ReviewStep } from './steps/ReviewStep';

/**
 * NEW TEMPORARY EXCAVATION APPLICATION — ORGANIZATION ONLY.
 *
 * The same application the Mahakhanij web portal takes, asked in the same
 * order, split into the five steps a phone can hold:
 *
 *   1 APPLICANT   who is applying          (pre-filled from the account)
 *   2 EXCAVATION  what, how much, how, when
 *   3 LOCATION    which quarry, and the pin on the map
 *   4 DOCUMENTS   the department's checklist
 *   5 REVIEW      read it back, declare, pay
 *
 * This component composes; it does not decide. Form state and step rules live
 * in `useApplicationForm`, field validation in @/rules/excavation, and each
 * step renders itself. That separation is deliberate — a five-step statutory
 * form is exactly the thing that turns into an unreadable thousand-line
 * screen if the state and the markup share a file.
 *
 * CONTEXT: project and package are attached from the operating context and
 * never asked for. An organization that reached this from a package is
 * applying for that package; one that did not is applying at organization
 * level. Adding a selector would ask for something already known in the first
 * case and invent a requirement in the second.
 */
export function NewApplicationScreen() {
  const organization = useCurrentOrganization();
  const user = useCurrentUser();
  const context = useOperatingContext();
  const navigate = useNavigate();
  const t = useCopy();

  const form = useApplicationForm({ user, organization, context });
  const minerals = useAsync(() => mineralRepository.listAll(), []);

  const isReview = form.step === 'REVIEW';
  const heading = HEADINGS[form.step];

  return (
    <Screen
      title={t.excavation.newApplication}
      onBack={() => {
        if (!form.back()) navigate(-1);
      }}
      context={<OrganizationContextBar showChange={false} />}
      footer={
        isReview ? (
          <div className="space-y-2">
            <Button
              size="lg"
              fullWidth
              loading={form.submitting}
              onClick={() => form.persist(true)}
            >
              {form.submitting ? t.excavation.submitting : t.excavation.payAndSubmit}
            </Button>
            <Button
              variant="ghost"
              fullWidth
              disabled={form.submitting}
              onClick={() => form.persist(false)}
            >
              {t.excavation.saveDraft}
            </Button>
          </div>
        ) : (
          <Button size="lg" fullWidth onClick={form.next}>
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
            <StepProgress current={form.stepIndex + 1} total={form.totalSteps} />
          </div>

          <div className="px-4 py-5">
            <h2 className="text-title-lg text-ink">{t.excavation[heading.title]}</h2>
            <p className="mt-1 text-body-sm text-ink-secondary">{t.excavation[heading.hint]}</p>
          </div>

          <Surface className="border-y border-line px-4 py-4">
            {form.step === 'APPLICANT' && (
              <ApplicantStep draft={form.draft} errors={form.errors} update={form.update} />
            )}

            {form.step === 'EXCAVATION' && (
              <ExcavationStep
                draft={form.draft}
                errors={form.errors}
                update={form.update}
                minerals={minerals.data}
              />
            )}

            {form.step === 'LOCATION' && (
              <LocationStep
                draft={form.draft}
                errors={form.errors}
                update={form.update}
                patch={form.patch}
              />
            )}

            {form.step === 'DOCUMENTS' && (
              <DocumentsStep
                documents={form.documents}
                attachedKinds={form.attachedKinds}
                errors={form.errors}
                onAttach={(kind) => form.attach(kind, t.excavation.docTypes[kind])}
                onRemove={form.detach}
              />
            )}

            {isReview && (
              <ReviewStep
                draft={form.draft}
                errors={form.errors}
                documents={form.documents}
                minerals={minerals.data}
                onDeclarationChange={(accepted) => form.update('declarationAccepted', accepted)}
                onEdit={form.goToStep}
              />
            )}
          </Surface>
        </>
      )}
    </Screen>
  );
}

/** Step heading and sub-heading, keyed by step. Copy lives in @/content. */
const HEADINGS = {
  APPLICANT: { title: 'stepApplicant', hint: 'stepApplicantHint' },
  EXCAVATION: { title: 'stepExcavation', hint: 'stepExcavationHint' },
  LOCATION: { title: 'stepLocation', hint: 'stepLocationHint' },
  DOCUMENTS: { title: 'stepDocuments', hint: 'stepDocumentsHint' },
  REVIEW: { title: 'stepReview', hint: 'stepReviewHint' },
} as const;
