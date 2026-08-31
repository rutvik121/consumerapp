import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Download, FileText, IndianRupee, ScrollText } from 'lucide-react';
import {
  awaitsApplicationFee,
  awaitsDemandNotePayment,
  formatMoney,
  formatQuantity,
  hasExcavationOrder,
  needsApplicantResponse,
  statusPresentation,
} from '@/rules';
import {
  Button,
  DetailList,
  ErrorState,
  ListGroup,
  ListRow,
  LoadingState,
  SectionHeader,
  StatusBadge,
  Surface,
} from '@/design-system';
import { ROUTES, Screen } from '@/navigation';
import {
  mineralRepository,
  packageRepository,
  paymentRepository,
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
 * The applicant's two actions are both payments, and only one is ever
 * available at a time:
 *
 *   DRAFT               → pay the application fee, which submits it
 *   DEMAND_NOTE_ISSUED  → pay the demand note, which issues the order
 *
 * PROVISIONAL (open question #7): there is no defined mechanism for responding
 * to a query from this app, so the screen says where to respond rather than
 * offering a button that cannot work.
 */
export function ApplicationDetailsScreen() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const t = useCopy();

  const query = useAsync(async () => {
    if (!applicationId) throw new Error('An application is required');

    const application = await temporaryExcavationRepository.getById(applicationId);
    if (!application) throw new Error('Application not found');

    const [minerals, project, activePackage, payments] = await Promise.all([
      mineralRepository.listAll(),
      application.projectId
        ? projectRepository.getById(application.projectId)
        : Promise.resolve(null),
      application.packageId
        ? packageRepository.getById(application.packageId)
        : Promise.resolve(null),
      paymentRepository.listByApplication(application.id),
    ]);

    return { application, minerals, project, activePackage, payments };
  }, [applicationId]);

  const application = query.data?.application;
  const mineral = query.data?.minerals.find(
    (candidate) => candidate.id === application?.mineralId,
  );

  return (
    <Screen
      title={t.excavation.title}
      {...(application ? { subtitle: application.applicationNumber } : {})}
      onBack
      footer={
        application && awaitsApplicationFee(application) ? (
          <Button
            size="lg"
            fullWidth
            leftIcon={<IndianRupee size={15} />}
            onClick={() =>
              navigate(ROUTES.applicationPayment(application.id, 'application-fee'))
            }
          >
            {t.excavation.payAndSubmit} · {formatMoney(application.applicationFee)}
          </Button>
        ) : application && awaitsDemandNotePayment(application) && application.demandNote ? (
          <Button
            size="lg"
            fullWidth
            leftIcon={<IndianRupee size={15} />}
            onClick={() => navigate(ROUTES.applicationPayment(application.id, 'demand-note'))}
          >
            {t.excavation.payDemandNote} · {formatMoney(application.demandNote.totalAmount)}
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

          {/* A draft has not been submitted — say so, plainly. */}
          {awaitsApplicationFee(application) && (
            <div className="border-b border-line bg-neutral-50 px-4 py-4">
              <p className="text-title text-ink">{t.excavation.awaitingFee}</p>
              <p className="mt-1 text-body-sm text-ink-secondary">{t.excavation.awaitingFeeBody}</p>
            </div>
          )}

          {/* Money owed, with a deadline and what it unlocks. */}
          {awaitsDemandNotePayment(application) && application.demandNote && (
            <div className="border-b border-warning-100 bg-warning-50 px-4 py-4">
              <p className="flex items-center gap-2 text-title text-warning-700">
                <IndianRupee size={17} className="shrink-0" aria-hidden />
                {t.excavation.demandNoteTitle}
              </p>
              <p className="mt-2 text-body text-warning-700">{t.excavation.demandNoteBody}</p>

              <div className="mt-4 rounded-md border border-warning-200 bg-surface">
                <DetailList
                  items={[
                    {
                      label: t.excavation.demandNoteNumber,
                      value: application.demandNote.demandNoteNumber,
                      numeric: true,
                    },
                    ...application.demandNote.breakdown.map((line) => ({
                      label: line.label,
                      value: formatMoney(line.amount),
                      numeric: true,
                    })),
                    {
                      label: t.excavation.dueBy,
                      value: formatDate(application.demandNote.dueDate),
                    },
                  ]}
                />
                <div className="flex items-baseline justify-between gap-4 border-t border-line px-4 py-3">
                  <span className="text-title text-ink">{t.payment.payableNow}</span>
                  <span className="tabular text-title-lg text-ink">
                    {formatMoney(application.demandNote.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* The end of the workflow: the order the applicant came for. */}
          {hasExcavationOrder(application) && application.excavationOrder && (
            <>
              <SectionHeader title={t.excavation.orderTitle} />
              <Surface className="border-y border-line">
                <div className="flex items-center gap-2 border-b border-line bg-success-50 px-4 py-3">
                  <ScrollText size={17} className="shrink-0 text-success-600" aria-hidden />
                  <span className="text-title text-success-700">
                    {application.excavationOrder.orderNumber}
                  </span>
                </div>
                <DetailList
                  items={[
                    {
                      label: t.excavation.permittedQuantity,
                      value: formatQuantity(application.excavationOrder.permittedQuantity),
                      numeric: true,
                    },
                    {
                      label: t.excavation.orderValidFrom,
                      value: formatDate(application.excavationOrder.validFrom),
                    },
                    {
                      label: t.excavation.orderValidUntil,
                      value: formatDate(application.excavationOrder.validUntil),
                    },
                  ]}
                />
                <div className="px-4 py-3">
                  {/* PROTOTYPE: a real build serves the signed order document. */}
                  <Button variant="secondary" fullWidth leftIcon={<Download size={15} />} disabled>
                    {t.excavation.downloadOrder}
                  </Button>
                </div>
              </Surface>
            </>
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

          <SectionHeader title={t.excavation.payments} />
          {query.data.payments.length === 0 ? (
            <Surface className="border-y border-line px-4 py-4">
              <p className="text-body-sm text-ink-muted">{t.excavation.noPayments}</p>
            </Surface>
          ) : (
            <ListGroup className="border-y border-line">
              {query.data.payments.map((payment) => (
                <ListRow
                  key={payment.id}
                  leading={<IndianRupee size={17} />}
                  leadingTone={payment.status === 'SUCCESS' ? 'success' : 'danger'}
                  title={formatMoney(payment.amount)}
                  subtitle={
                    payment.purpose === 'APPLICATION_FEE'
                      ? t.payment.applicationFee
                      : t.payment.demandNote
                  }
                  detail={payment.receiptNumber}
                  trailing={null}
                />
              ))}
            </ListGroup>
          )}

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
