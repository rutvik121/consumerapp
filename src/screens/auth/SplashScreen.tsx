import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandMark } from '@/design-system';
import { ROUTES } from '@/navigation';
import { useIsAuthenticated } from '@/state';

/**
 * The first screen. Resolves the persisted session and routes onward.
 *
 * It is short and purposeful rather than a decorative delay: a returning user
 * with a valid session goes straight to their experience and never sees it for
 * long. The brief pause exists so the app does not flash between two screens
 * while the session rehydrates.
 */
export function SplashScreen() {
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(isAuthenticated ? ROUTES.home : ROUTES.welcome, { replace: true });
    }, 700);

    return () => clearTimeout(timer);
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-canvas px-6">
      <BrandMark size="lg" showAttribution />
    </div>
  );
}
