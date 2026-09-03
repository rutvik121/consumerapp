import { useNavigate } from 'react-router-dom';
import { Building2, Plus } from 'lucide-react';
import { Button, EmptyState, ErrorState, ListGroup, ListRow, LoadingState } from '@/design-system';
import { ROUTES, Screen } from '@/navigation';
import { projectRepository, useAsync } from '@/data';
import { useCurrentUser } from '@/state';

export function ConsumerProjectsScreen() {
  const user = useCurrentUser();
  const navigate = useNavigate();

  const query = useAsync(async () => {
    if (!user) throw new Error('A session is required');
    return projectRepository.listForConsumer(user.id);
  }, [user?.id]);

  return (
    <Screen
      title="Projects"
      onBack
      actions={
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<Plus size={14} />}
          onClick={() => navigate(ROUTES.consumerProjectRegistration)}
        >
          New project
        </Button>
      }
    >
      {query.loading && <LoadingState variant="list" rows={4} />}
      {query.error && <ErrorState onRetry={query.reload} />}

      {query.data && (
        <>
          {query.data.length === 0 ? (
            <EmptyState
              icon={<Building2 size={22} />}
              title="No projects yet"
              description="Create your first project to track the site and material requirements for sourcing."
              action={
                <Button onClick={() => navigate(ROUTES.consumerProjectRegistration)}>
                  Register project
                </Button>
              }
            />
          ) : (
            <ListGroup className="border-y border-line">
              {query.data.map((project) => (
                <ListRow
                  key={project.id}
                  leading={<Building2 size={17} />}
                  title={project.name}
                  subtitle={`${project.location.taluka}, ${project.location.district}`}
                  detail={project.code}
                  onClick={() => navigate(ROUTES.consumerProjectDetails(project.id))}
                />
              ))}
            </ListGroup>
          )}
        </>
      )}
    </Screen>
  );
}
