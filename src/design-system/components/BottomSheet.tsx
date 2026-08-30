import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';
import { IconButton } from './IconButton';
import { getOverlayRoot } from './overlayRoot';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Hide the title visually while keeping it for screen readers. */
  hideTitle?: boolean;
  description?: string;
  children: ReactNode;
  /** Sticky action area pinned to the bottom of the sheet. */
  footer?: ReactNode;
  className?: string;
}

/**
 * The app's standard way to present a focused choice or a short form without
 * losing the context behind it.
 *
 * Prefer a sheet over a new screen when the task is short and the user should
 * keep their place. Prefer a screen when the task has multiple steps.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  hideTitle = false,
  description,
  children,
  footer,
  className,
}: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const root = getOverlayRoot();
  if (!open || !root) return null;

  return createPortal(
    <div className="pointer-events-auto absolute inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-neutral-900/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative flex max-h-[85%] flex-col rounded-t-xl bg-surface shadow-e3',
          'pb-[var(--safe-bottom)]',
          className,
        )}
      >
        {/* Grab handle — signals the sheet is dismissible. */}
        <div className="flex justify-center pt-2.5 pb-1">
          <span className="h-1 w-9 rounded-full bg-neutral-300" aria-hidden />
        </div>

        {!hideTitle && (
          <div className="flex items-start gap-2 px-4 pt-1 pb-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-title-lg text-ink">{title}</h2>
              {description && <p className="mt-1 text-body-sm text-ink-secondary">{description}</p>}
            </div>
            <IconButton label="Close" icon={<X size={19} />} onClick={onClose} className="-mt-1.5 -mr-1.5" />
          </div>
        )}

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">{children}</div>

        {footer && <div className="border-t border-line px-4 py-3">{footer}</div>}
      </div>
    </div>,
    root,
  );
}
