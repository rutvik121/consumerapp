import { useNavigate } from 'react-router-dom';
import { ContextBar } from '@/design-system';
import { useOperatingContext } from '@/state';
import { ROUTES } from './routes';

/**
 * The store-connected ContextBar.
 *
 * Renders nothing when there is no context to show — a Normal Consumer has no
 * hierarchy at all, and an Organization user who has not yet drilled into a
 * project has nothing to display. It never renders an empty or placeholder
 * strip, because a bar saying "no project selected" on every screen would be
 * chrome that carries no information.
 *
 * "Change" returns to the project list, which is the only place the scope can
 * actually be changed.
 */
export function OrganizationContextBar({
  showChange = true,
  /**
   * Set false on Package Details, where the package IS the screen title.
   * Repeating it in the strip below would truncate both and inform nobody.
   */
  showPackage = true,
}: {
  showChange?: boolean;
  showPackage?: boolean;
}) {
  const context = useOperatingContext();
  const navigate = useNavigate();

  if (!context?.projectName) return null;

  return (
    <ContextBar
      primary={context.projectName}
      {...(showPackage && context.packageName ? { secondary: context.packageName } : {})}
      {...(showChange ? { onChange: () => navigate(ROUTES.projects) } : {})}
    />
  );
}
