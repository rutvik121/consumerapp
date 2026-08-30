import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { cn } from '../utils/cn';
import { IconButton } from './IconButton';

export interface AppBarProps {
  title: string;
  /** Secondary line under the title — a reference number, a location. */
  subtitle?: string;
  onBack?: () => void;
  /** Right-aligned actions. Keep to two at most. */
  actions?: ReactNode;
  /**
   * Context strip rendered directly beneath the bar.
   * This is where Organization → Project → Package context lives, so it stays
   * visible without the user having to remember it.
   */
  context?: ReactNode;
  className?: string;
}

export function AppBar({ title, subtitle, onBack, actions, context, className }: AppBarProps) {
  return (
    <header className={cn('sticky top-0 z-30 bg-surface', className)}>
      <div className="flex h-[var(--appbar-h)] items-center gap-1 px-1">
        {onBack ? (
          <IconButton label="Back" icon={<ChevronLeft size={22} />} onClick={onBack} />
        ) : (
          <span className="w-3" />
        )}

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-title text-ink">{title}</h1>
          {subtitle && <p className="truncate text-caption text-ink-muted">{subtitle}</p>}
        </div>

        {actions && <div className="flex shrink-0 items-center gap-0.5 pr-1">{actions}</div>}
      </div>

      {context}

      <div className="h-px bg-line" />
    </header>
  );
}
