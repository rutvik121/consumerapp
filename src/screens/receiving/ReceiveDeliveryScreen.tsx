import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ShieldAlert, XCircle } from 'lucide-react';
import type { DiscrepancyReason, Quantity } from '@/domain';
import {
  assessDiscrepancy,
  formatQuantity,
  formatQuantityValue,
  permitPayloadFor,
  verifyTransport,
  type VerificationOutcome,
} from '@/rules';
import {
  Button,
  ConfirmDialog,
  DetailList,
  ErrorState,
  LoadingState,
  QuantityInput,
  SectionHeader,
  Select,
  StepProgress,
  Surface,
  Textarea,
  cn,
} from '@/design-system';
import { ROUTES, Screen } from '@/navigation';
import {
  deliveryRepository,
  mineralRepository,
  receivingRepository,
  useAsync,
  type ConfirmReceiptResult,
} from '@/data';
import { useCurrentUser } from '@/state';
import { useCopy } from '@/content';
import { QrScanPanel } from './QrScanPanel';

type Step = 'SCAN' | 'VALIDATE' | 'QUANTITY';

const TOTAL_STEPS = 3;

/**
 * RECEIVING — the destination end of the whole ecosystem.
 *
 *   Scan QR → Validate the transaction → Enter what actually arrived
 *   → Confirm → Inventory updated
 *
 * Three steps, because that is how many decisions the receiver actually makes.
 * The product context lists more stages than that, but verifying the permit,
 * the vehicle and the destination are one moment for the user — they either
 * all pass or the load does not come off the truck — so they are shown
 * together as four checks on one screen rather than as four screens.
 *
 * The discrepancy is computed and displayed LIVE as the quantity is typed. It
 * is the single most consequential number in the product, and it must never be
 * something the user discovers only after committing.
 */
export function ReceiveDeliveryScreen() {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const user = useCurrentUser();
  const navigate = useNavigate();
  const t = useCopy();

  const [step, setStep] = useState<Step>('SCAN');
  const [scanError, setScanError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<VerificationOutcome | null>(null);
  const [receivedValue, setReceivedValue] = useState<number | null>(null);
  const [reason, setReason] = useState<DiscrepancyReason | ''>('');
  const [remarks, setRemarks] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ConfirmReceiptResult | null>(null);

  const query = useAsync(async () => {
    if (!deliveryId) throw new Error('A delivery is required');

    const delivery = await deliveryRepository.getById(deliveryId);
    if (!delivery) throw new Error('Delivery not found');

    const minerals = await mineralRepository.listAll();
    return { delivery, minerals };
  }, [deliveryId]);

  const delivery = query.data?.delivery;
  const mineral = query.data?.minerals.find(
    (candidate) => candidate.id === delivery?.permit.mineralId,
  );

  const unit = delivery?.dispatchedQuantity.unit ?? 'MT';
  const received: Quantity = { value: receivedValue ?? 0, unit };
  const discrepancy = delivery
    ? assessDiscrepancy(delivery.dispatchedQuantity, received)
    : null;

  function handleScan(value: string) {
    if (!delivery) return;

    const payload = permitPayloadFor(value, delivery);
    const verified = verifyTransport(delivery, payload);

    if (!verified.results[0]?.passed) {
      setScanError('That permit does not match this delivery. Check the DigiTP number and try again.');
      return;
    }

    setScanError(null);
    setOutcome(verified);
    setStep('VALIDATE');
  }

  async function handleConfirm() {
    if (!delivery || !user || !outcome || receivedValue === null) return;

    setSubmitting(true);
    try {
      const confirmed = await receivingRepository.confirmReceipt({
        deliveryId: delivery.id,
        receivedByUserId: user.id,
        receivedQuantity: received,
        verification: outcome.verification,
        ...(discrepancy?.hasDiscrepancy && reason ? { discrepancyReason: reason } : {}),
        ...(remarks.trim() ? { remarks: remarks.trim() } : {}),
      });
      setResult(confirmed);
    } finally {
      setSubmitting(false);
      setConfirming(false);
    }
  }

  /* ---------- Done ---------- */
  if (result && delivery) {
    return (
      <Screen title={t.receiving.doneTitle}>
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <span
            className={cn(
              'mb-4 flex size-14 items-center justify-center rounded-full',
              result.receipt.hasDiscrepancy
                ? 'bg-warning-50 text-warning-600'
                : 'bg-success-50 text-success-600',
            )}
          >
            {result.receipt.hasDiscrepancy ? (
              <ShieldAlert size={28} aria-hidden />
            ) : (
              <CheckCircle2 size={28} aria-hidden />
            )}
          </span>

          <h2 className="text-title-lg text-ink">{t.receiving.doneTitle}</h2>
          <p className="mt-2 text-body text-ink-secondary">{t.receiving.doneBody}</p>

          <div className="mt-6 w-full">
            <QuantityComparison
              dispatched={result.receipt.dispatchedQuantity}
              received={result.receipt.receivedQuantity}
              difference={result.receipt.differenceQuantity}
              hasDiscrepancy={result.receipt.hasDiscrepancy}
            />
          </div>

          <Surface variant="outlined" rounded className="mt-4 w-full px-4 py-3 text-left">
            <p className="text-label text-ink-secondary">{t.receiving.nowAvailable}</p>
            <p className="tabular mt-1 text-display text-ink">
              {formatQuantityValue(result.availableQuantity)}{' '}
              <span className="text-title text-ink-muted">{result.availableQuantity.unit}</span>
            </p>
            <p className="mt-1 text-caption text-ink-muted">{mineral?.name}</p>
          </Surface>

          <div className="mt-8 w-full space-y-3">
            <Button
              size="lg"
              fullWidth
              onClick={() => navigate(ROUTES.deliveryTracking(delivery.id), { replace: true })}
            >
              {t.receiving.viewDelivery}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              fullWidth
              onClick={() => navigate(ROUTES.home, { replace: true })}
            >
              {t.receiving.backHome}
            </Button>
          </div>
        </div>
      </Screen>
    );
  }

  const stepNumber = step === 'SCAN' ? 1 : step === 'VALIDATE' ? 2 : 3;

  return (
    <Screen
      title={t.receiving.title}
      {...(delivery ? { subtitle: delivery.vehicle.registrationNumber } : {})}
      onBack={() => {
        if (step === 'QUANTITY') setStep('VALIDATE');
        else if (step === 'VALIDATE') setStep('SCAN');
        else navigate(-1);
      }}
      footer={
        step === 'QUANTITY' ? (
          <Button
            size="lg"
            fullWidth
            disabled={receivedValue === null || receivedValue <= 0}
            onClick={() => setConfirming(true)}
          >
            {t.receiving.confirmAction}
          </Button>
        ) : step === 'VALIDATE' && outcome?.valid ? (
          <Button size="lg" fullWidth onClick={() => setStep('QUANTITY')}>
            {t.receiving.weighNow}
          </Button>
        ) : undefined
      }
    >
      {query.loading && <LoadingState variant="screen" />}
      {query.error && <ErrorState onRetry={query.reload} />}

      {query.data && delivery && (
        <>
          <div className="border-b border-line bg-surface px-4 py-3">
            <StepProgress current={stepNumber} total={TOTAL_STEPS} />
          </div>

          {/* ---------- Step 1: scan ---------- */}
          {step === 'SCAN' && (
            <QrScanPanel
              onSubmit={handleScan}
              simulatedPayload={delivery.permit.qrPayload}
              error={scanError}
            />
          )}

          {/* ---------- Step 2: the four checks ---------- */}
          {step === 'VALIDATE' && outcome && (
            <div className="pb-6">
              <div
                className={cn(
                  'px-4 py-5',
                  outcome.valid ? 'bg-success-50' : 'bg-danger-50',
                )}
              >
                <div className="flex items-start gap-3">
                  {outcome.valid ? (
                    <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-success-600" aria-hidden />
                  ) : (
                    <XCircle size={22} className="mt-0.5 shrink-0 text-danger-600" aria-hidden />
                  )}
                  <div>
                    <h2
                      className={cn(
                        'text-title',
                        outcome.valid ? 'text-success-700' : 'text-danger-700',
                      )}
                    >
                      {outcome.valid ? t.receiving.validateTitle : t.receiving.validateFailedTitle}
                    </h2>
                    <p
                      className={cn(
                        'mt-1 text-body-sm',
                        outcome.valid ? 'text-success-700' : 'text-danger-700',
                      )}
                    >
                      {outcome.valid ? t.receiving.validateBody : t.receiving.validateFailedBody}
                    </p>
                  </div>
                </div>
              </div>

              <Surface className="border-y border-line">
                <ul className="divide-y divide-line">
                  {outcome.results.map((check) => (
                    <li key={check.check} className="flex items-start gap-3 px-4 py-3">
                      {check.passed ? (
                        <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-success-600" aria-hidden />
                      ) : (
                        <XCircle size={17} className="mt-0.5 shrink-0 text-danger-600" aria-hidden />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-body text-ink">{check.label}</p>
                        <p
                          className={cn(
                            'mt-0.5 text-body-sm tabular',
                            check.passed ? 'text-ink-secondary' : 'text-danger-600',
                          )}
                        >
                          {check.detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Surface>

              {/* What is on the truck, per the source. */}
              <SectionHeader title={t.receiving.reviewTitle} description={t.receiving.reviewBody} />
              <Surface className="border-y border-line px-4 py-4">
                <p className="tabular text-display text-ink">
                  {formatQuantity(delivery.dispatchedQuantity)}
                </p>
                <p className="mt-1 text-body text-ink-secondary">{mineral?.name}</p>
              </Surface>

              {!outcome.valid && (
                <div className="space-y-3 px-4 pt-5">
                  {/* PROVISIONAL (open question #7): no downstream dispute
                      workflow is defined, so the app stops the receipt and
                      says so rather than inventing an escalation path. */}
                  <Button variant="danger" fullWidth disabled>
                    {t.receiving.reportIssue}
                  </Button>
                  <p className="text-center text-caption text-ink-muted">
                    Reporting is not yet defined. Confirm with the transporter before offloading.
                  </p>
                  <Button variant="secondary" fullWidth onClick={() => setStep('SCAN')}>
                    {t.receiving.scanAgain}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ---------- Step 3: what actually arrived ---------- */}
          {step === 'QUANTITY' && discrepancy && (
            <div className="pb-6">
              <SectionHeader
                title={t.receiving.quantityTitle}
                description={t.receiving.quantityBody}
              />

              <Surface className="border-y border-line px-4 py-4">
                <QuantityInput
                  label={t.receiving.receivedLabel}
                  value={receivedValue}
                  unit={unit}
                  autoFocus
                  onChange={setReceivedValue}
                />
              </Surface>

              {/* The comparison updates as they type — never a surprise later. */}
              {receivedValue !== null && receivedValue > 0 && (
                <div className="px-4 pt-5">
                  <QuantityComparison
                    dispatched={delivery.dispatchedQuantity}
                    received={received}
                    difference={discrepancy.difference}
                    hasDiscrepancy={discrepancy.hasDiscrepancy}
                  />
                </div>
              )}

              {discrepancy.hasDiscrepancy && (
                <div className="space-y-4 px-4 pt-5">
                  {/* PROVISIONAL (open question #6): whether a categorised
                      reason is mandatory is unconfirmed, so it is offered and
                      not enforced. */}
                  <Select
                    label={t.receiving.reasonLabel}
                    placeholder={t.receiving.reasonPlaceholder}
                    value={reason}
                    options={[
                      { value: 'TRANSIT_LOSS', label: t.receiving.reason.TRANSIT_LOSS },
                      { value: 'MEASUREMENT_DIFFERENCE', label: t.receiving.reason.MEASUREMENT_DIFFERENCE },
                      { value: 'PARTIAL_OFFLOAD', label: t.receiving.reason.PARTIAL_OFFLOAD },
                      { value: 'OTHER', label: t.receiving.reason.OTHER },
                    ]}
                    onChange={(event) => setReason(event.target.value as DiscrepancyReason)}
                  />
                  <Textarea
                    label={t.receiving.remarksLabel}
                    placeholder={t.receiving.remarksPlaceholder}
                    value={remarks}
                    onChange={(event) => setRemarks(event.target.value)}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirming}
        title={t.receiving.confirmTitle}
        description={
          discrepancy?.hasDiscrepancy
            ? t.receiving.confirmBodyDiscrepancy
            : t.receiving.confirmBody
        }
        confirmLabel={t.receiving.confirmAction}
        loading={submitting}
        onConfirm={handleConfirm}
        onCancel={() => setConfirming(false)}
      />
    </Screen>
  );
}

/**
 * DISPATCHED / RECEIVED / DIFFERENCE.
 *
 * Laid out exactly as the product context specifies, and never collapsed into
 * a single "shortfall" line. Seeing all three side by side is what lets a site
 * operator check the arithmetic against the weighbridge slip in their hand.
 */
function QuantityComparison({
  dispatched,
  received,
  difference,
  hasDiscrepancy,
}: {
  dispatched: Quantity;
  received: Quantity;
  difference: Quantity;
  hasDiscrepancy: boolean;
}) {
  const t = useCopy();
  const shortage = difference.value > 0;

  return (
    <Surface
      variant="outlined"
      rounded
      className={cn('overflow-hidden', hasDiscrepancy && 'border-danger-200')}
    >
      <DetailList
        items={[
          { label: t.receiving.dispatched, value: formatQuantity(dispatched), numeric: true },
          { label: t.receiving.received, value: formatQuantity(received), numeric: true },
        ]}
      />

      <div
        className={cn(
          'flex items-center justify-between gap-4 border-t px-4 py-3',
          hasDiscrepancy ? 'border-danger-100 bg-danger-50' : 'border-line bg-success-50',
        )}
      >
        <span
          className={cn(
            'flex items-center gap-2 text-body-sm font-medium',
            hasDiscrepancy ? 'text-danger-700' : 'text-success-700',
          )}
        >
          {hasDiscrepancy ? (
            <>
              <AlertTriangle size={15} aria-hidden />
              {shortage ? t.receiving.shortage : t.receiving.excess}
            </>
          ) : (
            <>
              <CheckCircle2 size={15} aria-hidden />
              {t.receiving.difference}
            </>
          )}
        </span>
        <span
          className={cn(
            'tabular text-title',
            hasDiscrepancy ? 'text-danger-700' : 'text-success-700',
          )}
        >
          {hasDiscrepancy
            ? formatQuantity({ ...difference, value: Math.abs(difference.value) })
            : `0 ${difference.unit}`}
        </span>
      </div>
    </Surface>
  );
}
