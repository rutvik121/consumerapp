import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Boxes } from 'lucide-react';
import { formatQuantityValue, primaryAvailable, statusPresentation } from '@/rules';
import {
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
import {
  inventoryRepository,
  orderRepository,
  packageRepository,
  projectRepository,
  useAsync,
} from '@/data';
import { useOrganizationContextStore } from '@/state';
import { useCopy } from '@/content';
import { LocationLine } from './ProjectsScreen';

/**
 * ORGANIZATION ONLY — level 2 detail, and the first half of setting context.
 *
 * CONTEXT: opening a project SETS it as the active project. Navigating into a
 * scope is how a user says "this is what I am working on" — making them
 * confirm it with a separate selector afterwards would be exactly the
 * repetition the product context rules out.
 *
 * Choosing a different project clears any package selected under the old one,
 * which the store handles: a package only has meaning inside its own project.
 */
export function ProjectDetailsScreen() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const setProject = useOrganizationContextStore((state) => state.setProject);
  const t = useCopy();

  const query = useAsync(async () => {
    if (!projectId) throw new Error('A project is required');

    const project = await projectRepository.getById(projectId);
    if (!project) throw new Error('Project not found');

    const [packages, orders, balances] = await Promise.all([
      packageRepository.listByProject(projectId),
      orderRepository.list({ projectId }),
      inventoryRepository.list({ projectId }),
    ]);

    return { project, packages, orders, balances };
  }, [projectId]);

  const project = query.data?.project;

  useEffect(() => {
    if (project) setProject(project);
  }, [project, setProject]);

  const available = query.data ? primaryAvailable(query.data.balances) : null;

  return (
    <Screen
      title={project?.name ?? t.projects.projectDetails}
      {...(project ? { subtitle: project.code } : {})}
      onBack
    >
      {query.loading && <LoadingState variant="list" rows={4} />}
      {query.error && <ErrorState onRetry={query.reload} />}

      {query.data && project && (
        <div className="pb-8">
          <Surface className="border-b border-line px-4 py-4">
            <div className="mb-3 flex items-center gap-2">
              <StatusBadge {...statusPresentation.project(project.status)} />
            </div>
            <LocationLine
              text={`${project.location.line1}, ${project.location.taluka}, ${project.location.district}`}
            />

            <div className="mt-5 grid grid-cols-3 gap-4">
              <MetricTile
                label={t.projects.packages}
                value={query.data.packages.length}
              />
              <MetricTile
                label={t.organizationHome.activeOrders}
                value={
                  query.data.orders.filter((order) => order.receivingStatus !== 'RECEIVED').length
                }
              />
              <MetricTile
                label={t.fields.available}
                value={available ? formatQuantityValue(available) : '—'}
                {...(available ? { unit: available.unit } : {})}
              />
            </div>
          </Surface>

          <SectionHeader title={t.projects.packages} />

          {query.data.packages.length === 0 ? (
            <EmptyState
              icon={<Boxes size={22} />}
              title={t.projects.noPackages}
              description={t.projects.noPackagesBody}
            />
          ) : (
            <ListGroup className="border-y border-line">
              {query.data.packages.map((pkg) => (
                <ListRow
                  key={pkg.id}
                  leading={<Boxes size={17} />}
                  leadingTone={pkg.status === 'ACTIVE' ? 'primary' : 'neutral'}
                  title={pkg.name}
                  subtitle={`${pkg.siteAddress.taluka}, ${pkg.siteAddress.district}`}
                  detail={pkg.code}
                  meta={<StatusBadge {...statusPresentation.package(pkg.status)} size="sm" />}
                  onClick={() => navigate(ROUTES.packageDetails(project.id, pkg.id))}
                />
              ))}
            </ListGroup>
          )}
        </div>
      )}
    </Screen>
  );
}
