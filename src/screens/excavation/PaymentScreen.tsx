import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Download, FileCheck, FileText, Lock, ShieldAlert } from 'lucide-react';
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
            {succeeded && (
              <div className="space-y-2 rounded-2xl border border-[#d6e5f8] bg-[#f8fafc] p-3 text-left">
                <p className="text-[11px] font-bold uppercase text-neutral-500">Official Documents</p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const noteNum = paymentPurpose === 'APPLICATION_FEE' ? 'DM-244' : 'DM-936';
                      const content = paymentPurpose === 'APPLICATION_FEE' 
                        ? `=====================================================
REVENUE DEPARTMENT, GOVERNMENT OF MAHARASHTRA
DEMAND NOTE (APPLICATION FEE) — MAHAKHANIJ
=====================================================
DM No.                 : 244
Date & Time            : 03-08-2026 09:57:06 AM
Tahsil Office          : Tahsil Office Akole, Amrut Nagar, Akole 422601
Jurisdiction           : Maharashtra/ Nashik/ Ahilyanagar/ Sangamner/ Akole
-----------------------------------------------------
APPLICATION & LESSEE DETAILS
Application No.        : ${(settled ?? application).applicationNumber || 'MK/TPPA/20260803-1'}
Applicant / Lessee     : ${(settled ?? application).applicant.fullName || 'Kira K Patil'}
Mobile Number          : ${(settled ?? application).applicant.mobileNumber || '7543534535'}
PAN Number             : ${(settled ?? application).applicant.idProofNumber || 'LKMJK0987F'}
Address                : Pune, Maharashtra, India
-----------------------------------------------------
PLOT & EXCAVATION SPECIFICATIONS
District               : Ahilyanagar
SubDivision / Taluka   : Ahmednagar
City / Village         : Avhadwadi
Survey / Gat No.       : ${(settled ?? application).surveyNumber || '323'}
Permit Type            : TTP
Primary Mineral        : Stone
Quantity               : 122 Brass
-----------------------------------------------------
FEE BREAKDOWN
Application Fee        : ₹520.00
Payment Status         : PAID & VERIFIED (Challan: MH091123313123)
=====================================================
Note: System generated Demand Note, Tahsildar Akole, Ahilyanagar.`
                        : `=====================================================
REVENUE DEPARTMENT, GOVERNMENT OF MAHARASHTRA
DEMAND NOTE — MAHAKHANIJ
=====================================================
DM No.                 : 936
Date & Time            : 02-09-2026 06:06:43 PM
Office Address         : Nagar Tahsil Office, Savedi, Ahmednagar 414003
Jurisdiction           : Maharashtra/ Nashik/ Ahilyanagar/ Ahmednagar
-----------------------------------------------------
LESSEE & PLOT DETAILS
Lessee Name            : ${(settled ?? application).applicant.fullName || 'Satish Garg'}
Mobile Number          : ${(settled ?? application).applicant.mobileNumber || '6435435345'}
PAN Number             : ${(settled ?? application).applicant.idProofNumber || 'ANDPG4491M'}
Plot Name & Gat No.    : Gat No-323, Ismalpur, Ahmednagar
Permit Type            : TTP (RTP) · Stone
-----------------------------------------------------
PAYMENT BREAKDOWN
PART A: GOVERNMENT RECEIPT ACCOUNTING SYSTEM (GRAS)
1. Fees and Royalties  : ₹10.00
PART B: MAHAKHANIJ PORTAL
1. Ahmednagar DMF (10%): ₹1.00
2. SI Charges          : ₹2.00
3. SI Tax (18% GST)    : ₹0.36
4. Ahmednagar TCS      : ₹0.20
5. SI_ROFF             : ₹0.44
Total Amount           : ₹14.00
-----------------------------------------------------
GRAND TOTAL PAYABLE    : ${formatMoney(payment.amount)}
=====================================================
Issued by: Tahsildar Ahmednagar, Ahmednagar.`;

                      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `Demand_Note_${noteNum}.txt`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-2.5 text-body-sm font-semibold text-[#1241a6] shadow-2xs hover:bg-neutral-50 active:scale-[0.99] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <FileText size={15} />
                      <span>Download Demand Note ({paymentPurpose === 'APPLICATION_FEE' ? 'DM-244' : 'DM-936'})</span>
                    </span>
                    <Download size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const content = `=====================================================
GOVERNMENT OF MAHARASHTRA — GRAS e-RECEIPT
DEPARTMENT OF MINES & GEOLOGY
PAYMENT ACKNOWLEDGEMENT & CHALLAN
=====================================================
Receipt Number         : ${payment.receiptNumber || 'MHA-GRAS-110294'}
Bank Ref / Gateway UTR : ${payment.gatewayReference || 'MH091123313123'}
Application Ref No     : ${(settled ?? application).applicationNumber}
Payment Purpose        : ${paymentPurpose === 'APPLICATION_FEE' ? 'Temporary Excavation Application Fee' : 'Mineral Extraction Royalty & DMF'}
Amount Paid            : ${formatMoney(payment.amount)}
Date & Time            : ${payment.completedAt ? formatDateTime(payment.completedAt) : new Date().toLocaleString('en-IN')}
Status                 : SUCCESS / TREASURY CREDITED
-----------------------------------------------------
Payer Signatory        : ${(settled ?? application).applicant.fullName}
Entity / Jurisdiction  : Maharashtra Infrastructure Corporation Ltd. · Ahilyanagar
=====================================================`;

                      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `Receipt_${payment.receiptNumber || 'Payment'}.txt`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-2.5 text-body-sm font-semibold text-[#15803d] shadow-2xs hover:bg-neutral-50 active:scale-[0.99] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <FileCheck size={15} />
                      <span>Download Fee Payment Receipt</span>
                    </span>
                    <Download size={14} />
                  </button>
                </div>
              </div>
            )}

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
