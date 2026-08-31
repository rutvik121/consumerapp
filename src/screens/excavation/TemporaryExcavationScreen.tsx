import { useNavigate } from 'react-router-dom';
import { Plus, Shovel } from 'lucide-react';
import type { ID } from '@/domain';
import {
  formatQuantity,
  isApplicationActive,
  needsApplicantResponse,
  statusPresentation,
} from '@/rules';
import {
  Button,
  EmptyState,
  ErrorState,
  ListGroup,
  ListRow,
  LoadingState,
  MetricTile,
  SectionHeader,
  StatusBadge,
  Surface,
} from '@/design-system';
import { ROUTES, Screen } from '@/navigation';
import { mineralRepository, temporaryExcavationRepository, useAsync } from '@/data';
import { useCurrentOrganization } from '@/state';
import { useCopy } from '@/content';

/**
 * TEMPORARY EXCAVATION — ORGANIZATION ONLY.
 *
 * Presented as an operational module, not a promotional banner: a count of
 * what is open, a count of what is waiting on the organization, and the list.
 * The one action is starting a new application.
 *
 * A Normal Consumer cannot reach this screen. The capability is absent from
 * their matrix, so the tab is absent, the More entry is absent, and the route
 * guard redirects a direct URL Home without acknowledging the feature exists.
 */
export function TemporaryExcavationScreen() {
  const organization = useCurrentOrganization();
  const navigate = useNavigate();
  const t = useCopy();

  const query = useAsync(async () => {
    if (!organization) throw new Error('An organization is required');

    const [applications, minerals] = await Promise.all([
      temporaryExcavationRepository.listByOrganization(organization.id),
      mineralRepository.listAll(),
    ]);

    return { applications, minerals };
  }, [organization?.id]);

  const applications = query.data?.applications ?? [];
  const mineralName = (id: ID) =>
    query.data?.minerals.find((mineral) => mineral.id === id)?.name ?? 'Mineral';

  return (
    <Screen
      title={t.excavation.title}
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

      {query.data && applications.length === 0 && (
        <EmptyState
          icon={<Shovel size={22} />}
          title={t.excavation.noApplications}
          description={t.excavation.noApplicationsBody}
        />
      )}

      {query.data && applications.length > 0 && (
        <div className="pb-6">
          <Surface className="border-b border-line px-4 py-4">
            <div className="grid grid-cols-2 gap-6">
              <MetricTile
                label={t.excavation.active}
                value={applications.filter(isApplicationActive).length}
              />
              <MetricTile
                label={t.excavation.needsAttention}
                value={applications.filter(needsApplicantResponse).length}
                tone={applications.some(needsApplicantResponse) ? 'warning' : 'default'}
              />
            </div>
          </Surface>

          <SectionHeader title="Applications" />
          <ListGroup className="border-y border-line">
            {applications.map((application) => {
              const status = statusPresentation.temporaryExcavation(application.status);

              return (
                <ListRow
                  key={application.id}
                  leading={<Shovel size={17} />}
                  leadingTone={needsApplicantResponse(application) ? 'warning' : 'primary'}
                  title={`${mineralName(application.mineralId)} · ${formatQuantity(application.estimatedQuantity)}`}
                  subtitle={`Survey No. ${application.surveyNumber}, ${application.siteAddress.taluka}`}
                  detail={application.applicationNumber}
                  meta={<StatusBadge label={status.label} tone={status.tone} size="sm" />}
                  onClick={() => navigate(ROUTES.excavationApplication(application.id))}
                />
              );
            })}
          </ListGroup>
        </div>
      )}
    </Screen>
  );
}
