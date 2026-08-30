import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../utils/cn';
import { Button } from './Button';
import { getOverlayRoot } from './overlayRoot';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Uses the danger treatment for irreversible actions. */
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Reserved for actions that are irreversible or that assert something to the
 * wider Mahakhanij ecosystem — confirming a receipt, for example.
 *
 * Do not use it for routine navigation or ordinary form submission; a
 * confirmation the user always dismisses teaches them to stop reading.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel();
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  const root = getOverlayRoot();
  if (!open || !root) return null;

  return createPortal(
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center p-6">
      <button
        type="button"
        aria-label={cancelLabel}
        onClick={onCancel}
        className="absolute inset-0 bg-neutral-900/40"
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className={cn('relative w-full max-w-[320px] rounded-lg bg-surface p-5 shadow-e3')}
      >
        <h2 className="text-title-lg text-ink">{title}</h2>
        {description && <p className="mt-2 text-body text-ink-secondary">{description}</p>}

        <div className="mt-5 flex gap-2">
          <Button variant="secondary" fullWidth onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            fullWidth
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    root,
  );
}
