import { useNavigate } from 'react-router-dom';
import { Button, BrandMark } from '@/design-system';
import { ROUTES } from '@/navigation';
import { useCopy } from '@/content';

/**
 * The entry point.
 *
 * Two actions, one clearly primary. It states what the app does in a single
 * sentence and makes no promotional claims — this is a government operational
 * tool, and the first screen sets that expectation.
 */
export function WelcomeScreen() {
  const navigate = useNavigate();
  const t = useCopy();

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-canvas px-6">
      <div className="flex flex-1 flex-col items-center justify-center">
        <BrandMark size="lg" showAttribution />

        <h1 className="mt-10 text-center text-title-lg text-ink">{t.auth.welcomeTitle}</h1>
        <p className="mt-3 max-w-[34ch] text-center text-body text-ink-secondary">
          {t.auth.welcomeBody}
        </p>
      </div>

      <div className="shrink-0 space-y-3 pb-8">
        <Button size="lg" fullWidth onClick={() => navigate(ROUTES.login)}>
          {t.auth.signIn}
        </Button>
        <Button size="lg" variant="secondary" fullWidth onClick={() => navigate(ROUTES.register)}>
          {t.auth.createAccount}
        </Button>
      </div>
    </div>
  );
}
