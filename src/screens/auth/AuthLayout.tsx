import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { IconButton, cn } from '@/design-system';

export interface AuthLayoutProps {
  title?: string;
  description?: string;
  onBack?: (() => void) | true;
  /** Rendered under the app bar — the step indicator during registration. */
  header?: ReactNode;
  /** Sticky action area. Authentication always has one clear next action. */
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Frame for the pre-authenticated screens.
 *
 * Separate from `Screen` on purpose: there is no bottom navigation yet, no
 * operating context to display, and the primary action is pinned so it stays
 * reachable when the on-screen keyboard is open — which is the state these
 * screens are almost always in.
 */
export function AuthLayout({
  title,
  description,
  onBack,
  header,
  footer,
  children,
  className,
}: AuthLayoutProps) {
  const navigate = useNavigate();
  const handleBack = onBack === true ? () => navigate(-1) : onBack;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-canvas">
      <div className="flex h-[var(--appbar-h)] shrink-0 items-center px-1">
        {handleBack && (
          <IconButton label="Back" icon={<ChevronLeft size={22} />} onClick={handleBack} />
        )}
      </div>

      {header && <div className="shrink-0 px-6 pb-2">{header}</div>}

      <main className={cn('no-scrollbar min-h-0 flex-1 overflow-y-auto px-6', className)}>
        {title && <h1 className="text-display text-ink">{title}</h1>}
        {description && (
          <p className="mt-2 text-body text-ink-secondary">{description}</p>
        )}
        {children}
      </main>

      {footer && <div className="shrink-0 px-6 pt-3 pb-6">{footer}</div>}
    </div>
  );
}
