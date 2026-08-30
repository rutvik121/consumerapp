import { useNavigate } from 'react-router-dom';
import { Layers, MapPin } from 'lucide-react';
import type { Package, Project } from '@/domain';
import { statusPresentation } from '@/rules';
import {
  EmptyState,
  ErrorState,
  ListGroup,
  ListRow,
  LoadingState,
  StatusBadge,
} from '@/design-system';
import { ROUTES, Screen } from '@/navigation';
import { packageRepository, projectRepository, useAsync } from '@/data';
import { useCurrentOrganization } from '@/state';
import { useCopy } from '@/content';

/**
 * ORGANIZATION ONLY — level 2 of the hierarchy.
 *
 * The list answers "which project am I working on?" and nothing more. Package
 * counts are included because they are how a user recognises a project at a
 * glance; full operational detail belongs one level down.
 */
export function ProjectsScreen() {
  const organization = useCurrentOrganization();
  const t = useCopy();

  const query = useAsync(async () => {
    if (!organization) throw new Error('An organization is required');

    const projects = await projectRepository.listByOrganization(organization.id);
    const packages = await packageRepository.listByOrganization(organization.id);

    return { projects, packages };
  }, [organization?.id]);

  return (
    <Screen title={t.projects.title}>
      {query.loading && <LoadingState variant="list" rows={4} />}
      {query.error && <ErrorState onRetry={query.reload} />}

      {query.data && <ProjectList data={query.data} />}
    </Screen>
  );
}

/** Split out so `data` narrows once instead of at every usage. */
function ProjectList({ data }: { data: { projects: Project[]; packages: Package[] } }) {
  const navigate = useNavigate();
  const t = useCopy();

  if (data.projects.length === 0) {
    return (
      <EmptyState
        icon={<Layers size={22} />}
        title={t.projects.noProjects}
        description={t.projects.noProjectsBody}
      />
    );
  }

  return (
    <ListGroup className="border-b border-line">
      {data.projects.map((project) => (
        <ProjectRow
          key={project.id}
          project={project}
          packages={data.packages.filter((pkg) => pkg.projectId === project.id)}
          onOpen={() => navigate(ROUTES.projectDetails(project.id))}
        />
      ))}
    </ListGroup>
  );
}

function ProjectRow({
  project,
  packages,
  onOpen,
}: {
  project: Project;
  packages: Package[];
  onOpen: () => void;
}) {
  const t = useCopy();
  const status = statusPresentation.project(project.status);

  return (
    <ListRow
      leading={<Layers size={17} />}
      leadingTone={project.status === 'ACTIVE' ? 'primary' : 'neutral'}
      title={project.name}
      subtitle={`${project.location.district} · ${t.projects.packageCount(packages.length)}`}
      detail={project.code}
      meta={<StatusBadge label={status.label} tone={status.tone} size="sm" />}
      onClick={onOpen}
    />
  );
}

/** Shared by the project and package detail headers. */
export function LocationLine({ text }: { text: string }) {
  return (
    <p className="flex items-start gap-1.5 text-body-sm text-ink-secondary">
      <MapPin size={14} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden />
      <span>{text}</span>
    </p>
  );
}
