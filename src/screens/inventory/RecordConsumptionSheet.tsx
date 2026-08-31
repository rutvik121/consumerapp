import { useState } from 'react';
import { Info } from 'lucide-react';
import type { InventoryBalance, Quantity } from '@/domain';
import { canRecordConsumption, formatQuantity, subtractQuantity } from '@/rules';
import { BottomSheet, Button, Input, QuantityInput } from '@/design-system';
import { consumptionRepository } from '@/data';
import { useCurrentUser } from '@/state';
import { useCopy } from '@/content';

export interface RecordConsumptionSheetProps {
  open: boolean;
  onClose: () => void;
  balance: InventoryBalance;
  available: Quantity;
  onRecorded: () => void;
}

/**
 * A sheet, not a screen.
 *
 * Recording consumption is a short, frequent task done while looking at the
 * balance it draws down. A full screen would push that balance out of sight at
 * exactly the moment the user needs it to judge the number they are typing.
 *
 * The remaining quantity updates live, so the consequence of the entry is
 * visible before it is committed — the same principle as the receiving
 * discrepancy.
 */
export function RecordConsumptionSheet({
  open,
  onClose,
  balance,
  available,
  onRecorded,
}: RecordConsumptionSheetProps) {
  const user = useCurrentUser();
  const t = useCopy();

  const [quantity, setQuantity] = useState<number | null>(null);
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const requested: Quantity = { value: quantity ?? 0, unit: available.unit };
  const check = canRecordConsumption(balance, requested);
  const remaining = subtractQuantity(available, requested);
  const canSubmit = quantity !== null && quantity > 0 && check.allowed;

  async function handleRecord() {
    if (!user || !canSubmit) return;

    setSubmitting(true);
    try {
      await consumptionRepository.record({
        inventoryBalanceId: balance.id,
        recordedByUserId: user.id,
        quantity: requested,
        ...(purpose.trim() ? { purpose: purpose.trim() } : {}),
      });
      setQuantity(null);
      setPurpose('');
      onRecorded();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t.consumption.sheetTitle}
      description={t.consumption.sheetBody}
      footer={
        <Button size="lg" fullWidth disabled={!canSubmit} loading={submitting} onClick={handleRecord}>
          {submitting ? t.consumption.recording : t.consumption.record}
        </Button>
      }
    >
      <div className="space-y-4 px-4 pb-4">
        <div className="flex items-baseline justify-between gap-4 rounded-md bg-surface-sunken px-3 py-2.5">
          <span className="text-body-sm text-ink-secondary">{t.consumption.availableNow}</span>
          <span className="tabular text-title text-ink">{formatQuantity(available)}</span>
        </div>

        <QuantityInput
          label={t.consumption.quantityLabel}
          value={quantity}
          unit={available.unit}
          autoFocus
          onChange={setQuantity}
          {...(quantity !== null && quantity > 0 && !check.allowed && check.reason
            ? { error: check.reason }
            : {})}
        />

        {/* The consequence, before the commitment. */}
        {quantity !== null && quantity > 0 && check.allowed && (
          <p className="flex items-center gap-2 rounded-md bg-primary-50 px-3 py-2 text-body-sm text-primary-700">
            <Info size={15} className="shrink-0" aria-hidden />
            {t.consumption.remainingAfter}:{' '}
            <span className="tabular font-medium">{formatQuantity(remaining)}</span>
          </p>
        )}

        <Input
          label={t.consumption.purposeLabel}
          placeholder={t.consumption.purposePlaceholder}
          value={purpose}
          onChange={(event) => setPurpose(event.target.value)}
        />
      </div>
    </BottomSheet>
  );
}
