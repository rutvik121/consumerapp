import { useState } from 'react';
import { QrCode, ScanLine } from 'lucide-react';
import { Button, Input } from '@/design-system';
import { useCopy } from '@/content';

export interface QrScanPanelProps {
  /** Resolves the scanned or typed value. */
  onSubmit: (value: string) => void;
  /** PROTOTYPE ONLY — the payload a real camera would have read. */
  simulatedPayload: string;
  error?: string | null;
}

/**
 * QR SCANNING — one verification step, not the receiving experience.
 *
 * The camera is simulated: a real scanner needs device permissions this
 * prototype cannot meaningfully demonstrate, and what matters for review is
 * what the scan ENABLES — the four checks on the next step — not the capture
 * itself. Production replaces the simulate button with a camera stream;
 * everything downstream is already real.
 *
 * Manual e-TP entry is NOT a fallback afterthought. A camera that will not
 * focus on a dusty permit in direct sun at a site gate must never be the
 * reason a load cannot be received.
 */
export function QrScanPanel({ onSubmit, simulatedPayload, error }: QrScanPanelProps) {
  const [manual, setManual] = useState(false);
  const [value, setValue] = useState('');
  const t = useCopy();

  return (
    <div className="px-4 py-6">
      <div className="flex flex-col items-center text-center">
        <div className="relative flex size-40 items-center justify-center rounded-xl border-2 border-dashed border-line-strong bg-surface-sunken">
          <QrCode size={44} className="text-neutral-300" aria-hidden />
          <ScanLine
            size={40}
            className="absolute text-primary-500/70 motion-safe:animate-pulse"
            aria-hidden
          />
        </div>

        <h2 className="mt-6 text-title-lg text-ink">{t.receiving.scanTitle}</h2>
        <p className="mt-2 max-w-[34ch] text-body text-ink-secondary">{t.receiving.scanBody}</p>
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-md bg-danger-50 px-3 py-2 text-body-sm text-danger-700">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {/* ==== PROTOTYPE ONLY — replaced by a camera stream ==== */}
        <Button size="lg" fullWidth onClick={() => onSubmit(simulatedPayload)}>
          {t.receiving.scanAction}
        </Button>
        {/* ==== end prototype block ==== */}

        {manual ? (
          <div className="space-y-3 rounded-md border border-line bg-surface p-4">
            <Input
              label={t.receiving.etpLabel}
              hint={t.receiving.etpHint}
              placeholder="123456"
              autoFocus
              value={value}
              onChange={(event) => setValue(event.target.value.replace(/\D/g, '').slice(0, 6))}
            />
            <Button
              variant="secondary"
              fullWidth
              disabled={value.trim().length !== 6}
              onClick={() => onSubmit(value)}
            >
              {t.receiving.verifyAction}
            </Button>
          </div>
        ) : (
          <Button variant="ghost" fullWidth onClick={() => setManual(true)}>
            {t.receiving.enterManually}
          </Button>
        )}
      </div>
    </div>
  );
}
