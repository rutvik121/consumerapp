import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, cn } from '@/design-system';

export interface ScreenProps {
  title: string;
  subtitle?: string;
  /** Shows a back affordance. `true` goes back one entry in history. */
  onBack?: (() => void) | true;
  actions?: ReactNode;
  /** Context strip under the app bar — where ContextBar is rendered. */
  context?: ReactNode;
  /** Sticky action area above the bottom navigation. One primary action. */
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * The standard screen frame: app bar, scrollable body, optional sticky footer.
 *
 * Every screen uses it, so page structure, scroll behaviour and safe areas are
 * consistent by construction rather than by discipline.
 */
export function Screen({
  title,
  subtitle,
  onBack,
  actions,
  context,
  footer,
  children,
  className,
}: ScreenProps) {
  const navigate = useNavigate();
  const handleBack = onBack === true ? () => navigate(-1) : onBack;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-canvas">
      <AppBar
        title={title}
        {...(subtitle ? { subtitle } : {})}
        {...(handleBack ? { onBack: handleBack } : {})}
        {...(actions ? { actions } : {})}
        {...(context ? { context } : {})}
      />

      <main className={cn('no-scrollbar min-h-0 flex-1 overflow-y-auto', className)}>
        {children}
      </main>

      {footer && (
        <div className="shrink-0 border-t border-line bg-surface px-4 py-3 shadow-e2">{footer}</div>
      )}
    </div>
  );
}
