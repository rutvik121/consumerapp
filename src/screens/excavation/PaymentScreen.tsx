import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Lock, ShieldAlert } from 'lucide-react';
import type { Payment, PaymentPurpose, TemporaryExcavationApplication } from '@/domain';
import { formatMoney, statusPresentation } from '@/rules';
import {
  Button,
  DetailList,
  ErrorState,
  LoadingState,
  SectionHeader,
  StatusBadge,
  Surface,
  cn,
} from '@/design-system';
import { ROUTES, Screen } from '@/navigation';
import { paymentRepository, temporaryExcavationRepository, useAsync } from '@/data';
import { useCopy } from '@/content';

type Stage = 'SUMMARY' | 'REDIRECTING' | 'SUCCESS' | 'FAILED';

/** How long the simulated gateway hand-off is shown. */
const REDIRECT_MS = 2200;

/**
 * PAYMENT — the two moments that move a Temporary Excavation application.
 *
 *   APPLICATION_FEE  paying it SUBMITS the application, automatically
 *   DEMAND_NOTE      paying it ISSUES the excavation order
 *
 * One screen for both, because the payer's task is identical: see what is
 * owed, hand off to the gateway, learn what happened. Only the consequence
 * differs, and that is stated on the success screen rather than built twice.
 *
 * The gateway is simulated. What is NOT simulated is the shape: a payment is
 * initiated, control leaves the app, and a result is reconciled afterwards.
 * A prototype that flipped a flag would hide the only part of this the
 * production team actually has to build.
 */
export function PaymentScreen() {
  const { applicationId, purpose } = useParams<{ applicationId: string; purpose: string }>();
  const navigate = useNavigate();
  const t = useCopy();

  const [stage, setStage] = useState<Stage>('SUMMARY');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [failNext, setFailNext] = useState(false);
  /* The application AFTER the payment settled — its number and status both
     change on success, and the copy loaded before the payment is now stale. */
  const [settled, setSettled] = useState<TemporaryExcavationApplication | null>(null);

  const paymentPurpose: PaymentPurpose =
    purpose === 'demand-note' ? 'DEMAND_NOTE' : 'APPLICATION_FEE';

  const query = useAsync(async () => {
    if (!applicationId) throw new Error('An application is required');
    const application = await temporaryExcavationRepository.getById(applicationId);
    if (!application) throw new Error('Application not found');
    return { application };
  }, [applicationId]);

  const application = query.data?.application;
  const amount =
    paymentPurpose === 'APPLICATION_FEE'
      ? application?.applicationFee
      : application?.demandNote?.totalAmount;

  /* The hand-off. In production this is a real redirect and a real return. */
  useEffect(() => {
    if (stage !== 'REDIRECTING' || !payment) return;

    const timer = setTimeout(async () => {
      const result = await paymentRepository.complete({
        paymentId: payment.id,
        outcome: failNext ? 'FAILED' : 'SUCCESS',
      });
      setPayment(result.payment);
      setSettled(result.application);
      setStage(result.payment.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED');
    }, REDIRECT_MS);

    return () => clearTimeout(timer);
  }, [stage, payment, failNext]);

  async function startPayment(shouldFail: boolean) {
    if (!applicationId) return;
    setFailNext(shouldFail);
    const initiated = await paymentRepository.initiate({
      applicationId,
      purpose: paymentPurpose,
    });
    setPayment(initiated);
    setStage('REDIRECTING');
  }

  const purposeLabel =
    paymentPurpose === 'APPLICATION_FEE' ? t.payment.applicationFee : t.payment.demandNote;

  /* ---------- Handing off to the gateway ---------- */
  if (stage === 'REDIRECTING' && amount) {
    return (
      <Screen title={t.payment.title}>
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <span className="mb-5 flex size-16 items-center justify-center rounded-full bg-warning-50 text-warning-600">
            <Lock size={28} aria-hidden />
          </span>
          <h2 className="text-title-lg text-ink">{t.payment.redirectingTitle}</h2>
          <p className="mt-2 max-w-[34ch] text-body text-ink-secondary">
            {t.payment.redirectingBody}
          </p>

          <p className="tabular mt-8 text-display text-ink">{formatMoney(amount)}</p>
          <p className="mt-1 text-body-sm text-ink-muted">{purposeLabel}</p>

          <div className="mt-8">
            <LoadingState variant="inline" label={t.payment.doNotClose} />
          </div>
        </div>
      </Screen>
    );
  }

  /* ---------- Result ---------- */
  if ((stage === 'SUCCESS' || stage === 'FAILED') && payment && application) {
    const succeeded = stage === 'SUCCESS';

    return (
      <Screen title={succeeded ? t.payment.successTitle : t.payment.failedTitle}>
        <div className="px-4 pt-10 pb-8">
          <div className="flex flex-col items-center text-center">
            <span
              className={cn(
                'mb-4 flex size-14 items-center justify-center rounded-full',
                succeeded ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-600',
              )}
            >
              {succeeded ? <CheckCircle2 size={28} aria-hidden /> : <ShieldAlert size={28} aria-hidden />}
            </span>
            <h2 className="text-title-lg text-ink">
              {succeeded ? t.payment.successTitle : t.payment.failedTitle}
            </h2>
            <p className="tabular mt-3 text-display text-ink">{formatMoney(payment.amount)}</p>
            <p className="mt-1 text-body-sm text-ink-muted">{purposeLabel}</p>
          </div>

          {succeeded ? (
            <>
              {/* What was just created, so the applicant leaves with the
                  reference number rather than having to go and find it. */}
              <SectionHeader title={t.excavation.applicationInformation} />
              <Surface variant="outlined" rounded className="overflow-hidden">
                <DetailList
                  items={[
                    {
                      label: t.excavation.title,
                      value: (settled ?? application).applicationNumber,
                      numeric: true,
                    },
                    ...((settled ?? application).submittedAt
                      ? [
                          {
                            label: t.excavation.submittedOn,
                            value: formatDateTime((settled ?? application).submittedAt as string),
                          },
                        ]
                      : []),
                  ]}
                />
                <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
                  <span className="text-body-sm text-ink-secondary">{t.fields.status}</span>
                  <StatusBadge
                    {...statusPresentation.temporaryExcavation((settled ?? application).status)}
                  />
                </div>
              </Surface>

              <SectionHeader title={t.payment.receipt} />
              <Surface variant="outlined" rounded className="overflow-hidden">
                <DetailList
                  items={[
                    { label: t.payment.receipt, value: payment.receiptNumber, numeric: true },
                    { label: t.payment.reference, value: payment.gatewayReference ?? '—', numeric: true },
                    { label: t.payment.method, value: payment.method ?? '—' },
                    {
                      label: t.payment.paidOn,
                      value: payment.completedAt ? formatDateTime(payment.completedAt) : '—',
                    },
                  ]}
                />
              </Surface>

              {/* The consequence of this payment, stated plainly. */}
              <SectionHeader title={t.payment.whatNext} />
              <Surface variant="outlined" rounded className="px-4 py-3">
                <p className="text-body text-ink-secondary">
                  {paymentPurpose === 'APPLICATION_FEE'
                    ? t.payment.nextAfterFee
                    : t.payment.nextAfterDemandNote}
                </p>
              </Surface>
            </>
          ) : (
            <Surface variant="outlined" rounded className="mt-6 px-4 py-3">
              {/* The reason AND the reassurance. "Declined by the bank" alone
                  leaves the payer's first question — was I charged? —
                  unanswered, which is the worst thing a failed payment screen
                  can do. */}
              {payment.failureReason && (
                <p className="text-body text-ink">{payment.failureReason}</p>
              )}
              <p className="mt-1 text-body text-ink-secondary">{t.payment.failedBody}</p>
            </Surface>
          )}

          <div className="mt-8 space-y-3">
            {!succeeded && (
              <Button size="lg" fullWidth onClick={() => startPayment(false)}>
                {t.payment.tryAgain}
              </Button>
            )}
            <Button
              size="lg"
              variant={succeeded ? 'primary' : 'secondary'}
              fullWidth
              onClick={() =>
                navigate(ROUTES.excavationApplication(application.id), { replace: true })
              }
            >
              {t.payment.viewApplication}
            </Button>
          </div>
        </div>
      </Screen>
    );
  }

  /* ---------- What is owed ---------- */
  return (
    <Screen
      title={t.payment.title}
      {...(application ? { subtitle: application.applicationNumber } : {})}
      onBack
      footer={
        amount ? (
          <Button size="lg" fullWidth leftIcon={<Lock size={15} />} onClick={() => startPayment(false)}>
            {t.payment.proceed} · {formatMoney(amount)}
          </Button>
        ) : undefined
      }
    >
      {query.loading && <LoadingState variant="list" rows={3} />}
      {query.error && <ErrorState onRetry={query.reload} />}

      {query.data && application && amount && (
        <div className="pb-6">
          <SectionHeader title={t.payment.summary} />
          <Surface className="border-y border-line">
            <DetailList
              items={
                paymentPurpose === 'DEMAND_NOTE' && application.demandNote
                  ? [
                      ...application.demandNote.breakdown.map((line) => ({
                        label: line.label,
                        value: formatMoney(line.amount),
                        numeric: true,
                      })),
                    ]
                  : [{ label: t.payment.applicationFee, value: formatMoney(amount), numeric: true }]
              }
            />
          </Surface>

          <Surface className="mt-4 border-y border-line px-4 py-4">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-title text-ink">{t.payment.payableNow}</span>
              <span className="tabular text-title-lg text-ink">{formatMoney(amount)}</span>
            </div>
            {paymentPurpose === 'APPLICATION_FEE' && (
              <p className="mt-2 text-body-sm text-ink-secondary">{t.excavation.feeNote}</p>
            )}
          </Surface>

          {/* ==== PROTOTYPE ONLY — a real gateway decides the outcome ==== */}
          <div className="px-4 pt-6">
            <button
              type="button"
              onClick={() => startPayment(true)}
              className="w-full rounded-md border border-dashed border-line-strong bg-surface px-3 py-2 text-caption text-ink-muted"
            >
              {t.payment.simulateFailure}
            </button>
          </div>
          {/* ==== end prototype block ==== */}
        </div>
      )}
    </Screen>
  );
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
