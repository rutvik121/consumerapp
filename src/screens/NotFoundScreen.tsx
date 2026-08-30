import { useNavigate } from 'react-router-dom';
import { Button, EmptyState } from '@/design-system';
import { Screen, ROUTES } from '@/navigation';

export function NotFoundScreen() {
  const navigate = useNavigate();

  return (
    <Screen title="Not found">
      <EmptyState
        title="This page does not exist"
        description="The link may be out of date, or the screen has not been built yet."
        action={
          <Button variant="secondary" onClick={() => navigate(ROUTES.home, { replace: true })}>
            Go to Home
          </Button>
        }
      />
    </Screen>
  );
}
