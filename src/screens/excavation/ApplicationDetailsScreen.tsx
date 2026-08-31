import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, FileText } from 'lucide-react';
import {
  canSubmitApplication,
  formatQuantity,
  needsApplicantResponse,
  statusPresentation,
} from '@/rules';
import {
  Button,
  ConfirmDialog,
  DetailList,
  ErrorState,
  ListGroup,
  ListRow,
  LoadingState,
  SectionHeader,
  StatusBadge,
  Surface,
} from '@/design-system';
import { Screen } from '@/navigation';
import {
  mineralRepository,
  packageRepository,
  projectRepository,
  temporaryExcavationRepository,
  useAsync,
} from '@/data';
import { useCopy } from '@/content';

/**
 * ONE APPLICATION, AND WHERE IT STANDS.
 *
 * A raised query is the only state where the department is waiting on the
 * organization, so it is the only thing promoted above the application's own
 * details — everything else is reference material until the status changes.
 *
 * PROVISIONAL (open question #5 / #7): there is no defined mechanism for
 * responding to a query from this app, so the screen says where to respond
 * rather than offering a button that cannot work. Submitting a draft is the
 * one transition the applicant genuinely owns.
 */
export function ApplicationDetailsScreen() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const t = useCopy();

  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const query = useAsync(async () => {
    if (!applicationId) throw new Error('An application is required');

    const application = await temporaryExcavationRepository.getById(applicationId);
    if (!application) throw new Error('Application not found');

    const [minerals, project, activePackage] = await Promise.all([
      mineralRepository.listAll(),
      application.projectId
        ? projectRepository.getById(application.projectId)
        : Promise.resolve(null),
      application.packageId
        ? packageRepository.getById(application.packageId)
        : Promise.resolve(null),
    ]);

    return { application, minerals, project, activePackage };
  }, [applicationId]);

  const application = query.data?.application;
  const mineral = query.data?.minerals.find(
    (candidate) => candidate.id === application?.mineralId,
  );

  async function handleSubmit() {
    if (!application) return;
    setSubmitting(true);
    try {
      await temporaryExcavationRepository.submit(application.id);
      query.reload();
    } finally {
      setSubmitting(false);
      setConfirming(false);
    }
  }

  return (
    <Screen
      title={t.excavation.title}
      {...(application ? { subtitle: application.applicationNumber } : {})}
      onBack
      footer={
        application && canSubmitApplication(application) ? (
          <Button size="lg" fullWidth onClick={() => setConfirming(true)}>
            {t.excavation.submitDraft}
          </Button>
        ) : undefined
      }
    >
      {query.loading && <LoadingState variant="list" rows={4} />}
      {query.error && <ErrorState onRetry={query.reload} />}

      {query.data && application && (
        <div className="pb-8">
          <Surface className="border-b border-line px-4 py-4">
            <StatusBadge {...statusPresentation.temporaryExcavation(application.status)} />
            <p className="tabular mt-3 text-display text-ink">
              {formatQuantity(application.estimatedQuantity)}
            </p>
            <p className="mt-1 text-body text-ink-secondary">{mineral?.name}</p>
          </Surface>

          {/* The only state where the organization owes the department. */}
          {needsApplicantResponse(application) && (
            <div className="border-b border-warning-100 bg-warning-50 px-4 py-4">
              <p className="flex items-center gap-2 text-title text-warning-700">
                <AlertTriangle size={17} className="shrink-0" aria-hidden />
                {t.excavation.queryTitle}
              </p>
              {application.statusRemarks && (
                <p className="mt-2 text-body text-warning-700">{application.statusRemarks}</p>
              )}
              <p className="mt-3 text-caption text-warning-700/80">
                {t.excavation.responseNote}
              </p>
            </div>
          )}

          <SectionHeader title={t.excavation.site} />
          <Surface className="border-y border-line">
            <DetailList
              items={[
                { label: t.excavation.surveyNumber, value: application.surveyNumber, numeric: true },
                {
                  label: 'Address',
                  value: `${application.siteAddress.line1}, ${application.siteAddress.taluka}, ${application.siteAddress.district} — ${application.siteAddress.pincode}`,
                },
                ...(query.data.project
                  ? [{ label: t.context.project, value: query.data.project.name }]
                  : []),
                ...(query.data.activePackage
                  ? [{ label: t.context.package, value: query.data.activePackage.name }]
                  : []),
              ]}
            />
          </Surface>

          <SectionHeader title={t.excavation.excavationDetails} />
          <Surface className="border-y border-line">
            <DetailList
              items={[
                { label: t.excavation.mineral, value: mineral?.name ?? '—' },
                {
                  label: t.excavation.estimatedQuantity,
                  value: formatQuantity(application.estimatedQuantity),
                  numeric: true,
                },
                { label: t.excavation.area, value: `${application.areaInSqm} sq m`, numeric: true },
                { label: t.excavation.depth, value: `${application.depthInMetres} m`, numeric: true },
                { label: t.excavation.purpose, value: application.purpose },
              ]}
            />
          </Surface>

          <SectionHeader title={t.excavation.period} />
          <Surface className="border-y border-line">
            <DetailList
              items={[
                { label: t.excavation.from, value: formatDate(application.fromDate) },
                { label: t.excavation.to, value: formatDate(application.toDate) },
                ...(application.submittedAt
                  ? [{ label: t.excavation.submittedOn, value: formatDate(application.submittedAt) }]
                  : []),
                {
                  label: t.excavation.lastUpdated,
                  value: formatDate(application.statusUpdatedAt),
                },
              ]}
            />
          </Surface>

          <SectionHeader title={t.excavation.documents} />
          {application.documents.length === 0 ? (
            <Surface className="border-y border-line px-4 py-4">
              <p className="text-body-sm text-ink-muted">{t.excavation.noDocuments}</p>
            </Surface>
          ) : (
            <ListGroup className="border-y border-line">
              {application.documents.map((document) => (
                <ListRow
                  key={document.id}
                  leading={<FileText size={17} />}
                  leadingTone="neutral"
                  title={document.documentType}
                  subtitle={document.fileName}
                  trailing={null}
                />
              ))}
            </ListGroup>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirming}
        title={t.excavation.submitTitle}
        description={t.excavation.submitBody}
        confirmLabel={t.excavation.submitDraft}
        loading={submitting}
        onConfirm={handleSubmit}
        onCancel={() => setConfirming(false)}
      />
    </Screen>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
