import { useNavigate, useSearchParams } from 'react-router-dom';
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

export function NewApplicationScreen() {
  const organization = useCurrentOrganization();
  const user = useCurrentUser();
  const context = useOperatingContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draftId');
  const t = useCopy();

  const form = useApplicationForm({ user, organization, context, draftId });
  const minerals = useAsync(() => mineralRepository.listAll(), []);

  const isReview = form.step === 'REVIEW';
  const heading = HEADINGS[form.step];

  return (
    <Screen
      title={draftId ? 'Resume Application' : t.excavation.newApplication}
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
                onAttach={(kind, label, docNum) => form.attach(kind, label, docNum)}
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
