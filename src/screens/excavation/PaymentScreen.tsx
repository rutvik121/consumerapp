import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Check,
  CheckCircle2,
  Download,
  FileCheck,
  Lock,
  Receipt,
  ShieldAlert,
} from 'lucide-react';
import type { Money, Payment, PaymentPurpose, TemporaryExcavationApplication } from '@/domain';
import {
  calculateApplicationFeeBreakdown,
  computeDetailedDemandNoteBreakdown,
  formatMoney,
  formatQuantity,
} from '@/rules';
import {
  Button,
  ErrorState,
  LoadingState,
  cn,
} from '@/design-system';
import { ROUTES, Screen } from '@/navigation';
import { paymentRepository, temporaryExcavationRepository, useAsync } from '@/data';

type Stage = 'SUMMARY' | 'REDIRECTING' | 'SUCCESS' | 'FAILED';

/** How long the simulated gateway hand-off is shown. */
const REDIRECT_MS = 1800;

export function PaymentScreen() {
  const { applicationId, purpose } = useParams<{ applicationId: string; purpose: string }>();
  const navigate = useNavigate();

  const [stage, setStage] = useState<Stage>('SUMMARY');
  const [currentChannel, setCurrentChannel] = useState<'GRAS' | 'MAHAKHANIJ'>('GRAS');
  const [grasPaid, setGrasPaid] = useState(false);
  const [mahakhanijPaid, setMahakhanijPaid] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [failNext, setFailNext] = useState(false);
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
  const quantityValue = application?.estimatedQuantity?.value || 10;

  // 1. Application Fee Breakdown (Stage 1 Submission - GRAS Only)
  const appFeeBreakdown = calculateApplicationFeeBreakdown(quantityValue);

  // 2. Demand Note Breakdown (Stage 2 Assessment - GRAS Royalty + MahaKhanij DMF)
  const demandNoteSplit = application
    ? computeDetailedDemandNoteBreakdown(application.estimatedQuantity)
    : null;

  const grasDemandAmount: Money = demandNoteSplit?.gras.total || { amount: 2200, currency: 'INR' };
  const mahakhanijDemandAmount: Money = demandNoteSplit?.mahakhanij.total || { amount: 559, currency: 'INR' };
  const demandGrandTotal: Money = {
    amount: grasDemandAmount.amount + mahakhanijDemandAmount.amount,
    currency: 'INR',
  };

  const amount: Money =
    paymentPurpose === 'APPLICATION_FEE'
      ? appFeeBreakdown.totalFee
      : currentChannel === 'GRAS'
      ? grasDemandAmount
      : mahakhanijDemandAmount;

  /* The hand-off simulation */
  useEffect(() => {
    if (stage !== 'REDIRECTING' || !payment) return;

    const timer = setTimeout(async () => {
      const isSuccess = !failNext;
      if (isSuccess) {
        if (paymentPurpose === 'APPLICATION_FEE') {
          // Application fee goes to GRAS and automatically submits the proposal
          const result = await paymentRepository.complete({
            paymentId: payment.id,
            outcome: 'SUCCESS',
          });
          setSettled(result.application);
          setStage('SUCCESS');
        } else {
          // Demand note requires both GRAS and MahaKhanij
          if (currentChannel === 'GRAS') {
            setGrasPaid(true);
            setStage('SUMMARY');
          } else {
            setMahakhanijPaid(true);
            const result = await paymentRepository.complete({
              paymentId: payment.id,
              outcome: 'SUCCESS',
            });
            setSettled(result.application);
            setStage('SUCCESS');
          }
        }
      } else {
        setStage('FAILED');
      }
    }, REDIRECT_MS);

    return () => clearTimeout(timer);
  }, [stage, payment, failNext, currentChannel, paymentPurpose]);

  async function startPayment(channel: 'GRAS' | 'MAHAKHANIJ', shouldFail: boolean) {
    if (!applicationId) return;
    setCurrentChannel(channel);
    setFailNext(shouldFail);
    const initiated = await paymentRepository.initiate({
      applicationId,
      purpose: paymentPurpose,
    });
    setPayment(initiated);
    setStage('REDIRECTING');
  }

  const purposeLabel =
    paymentPurpose === 'APPLICATION_FEE'
      ? 'GRAS Cyber Treasury (Statutory Application Fee & Stamp Duty)'
      : currentChannel === 'GRAS'
      ? 'GRAS Cyber Treasury (Mineral Extraction Royalty Head)'
      : 'MahaKhanij Gateway (DMF & SI Infrastructure)';

  /* ---------- Handing off to the gateway ---------- */
  if (stage === 'REDIRECTING' && amount) {
    return (
      <Screen title={currentChannel === 'GRAS' ? 'GRAS Cyber Treasury' : 'MahaKhanij Payment'}>
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center min-h-[60vh]">
          <span className="mb-5 flex size-16 items-center justify-center rounded-full bg-primary-50 text-primary-700 ring-8 ring-primary-50/50 animate-pulse">
            <Lock size={28} aria-hidden />
          </span>
          <h2 className="text-title-lg text-ink font-bold">
            {currentChannel === 'GRAS'
              ? 'Connecting to Cyber Treasury GRAS...'
              : 'Connecting to MahaKhanij Gateway...'}
          </h2>
          <p className="mt-2 max-w-[34ch] text-body text-ink-secondary">
            {currentChannel === 'GRAS'
              ? 'Redirecting to Government Receipt Accounting System (gras.mahakosh.gov.in) for secure treasury settlement.'
              : 'Processing District Mineral Foundation (DMF) and Supervision charges.'}
          </p>

          <p className="tabular mt-6 text-display text-primary-700 font-bold">
            {formatMoney(amount)}
          </p>
          <p className="mt-1 text-caption text-ink-muted">{purposeLabel}</p>

          <div className="mt-8">
            <LoadingState variant="inline" label="Please do not refresh or close this window" />
          </div>
        </div>
      </Screen>
    );
  }

  /* ---------- Result (Application Fee or Demand Note Settled) ---------- */
  if ((stage === 'SUCCESS' || stage === 'FAILED') && application) {
    const succeeded = stage === 'SUCCESS';

    return (
      <Screen title={succeeded ? 'Payment Verified & Settled' : 'Payment Incomplete'}>
        <div className="px-4 pt-6 pb-8 space-y-5">
          <div className="flex flex-col items-center text-center">
            <span
              className={cn(
                'mb-4 flex size-14 items-center justify-center rounded-full',
                succeeded ? 'bg-success-50 text-success-600 ring-8 ring-success-50/60' : 'bg-danger-50 text-danger-600',
              )}
            >
              {succeeded ? <CheckCircle2 size={32} aria-hidden /> : <ShieldAlert size={32} aria-hidden />}
            </span>
            <h2 className="text-title-lg text-ink font-bold">
              {succeeded
                ? paymentPurpose === 'DEMAND_NOTE'
                  ? 'All Payments Verified · Permit Granted!'
                  : 'Application Fee Verified & Submitted!'
                : 'Payment Transaction Failed'}
            </h2>
            <p className="tabular mt-2 text-2xl font-bold text-primary-700">
              {formatMoney(
                paymentPurpose === 'APPLICATION_FEE' ? appFeeBreakdown.totalFee : demandGrandTotal
              )}
            </p>
            <p className="mt-0.5 text-caption text-neutral-500">
              {paymentPurpose === 'APPLICATION_FEE'
                ? 'Statutory Application Fee Settled via GRAS Cyber Treasury'
                : 'GRAS Royalty & MahaKhanij DMF Fully Reconciled'}
            </p>
          </div>

          {succeeded ? (
            <div className="space-y-4">
              {/* Application Summary Card */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
                  <span className="text-caption font-medium text-neutral-500">Application Number</span>
                  <span className="font-mono text-body-sm font-bold text-[#1241a6]">
                    {(settled ?? application).applicationNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-caption font-medium text-neutral-500">Status</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-caption font-bold text-emerald-700 border border-emerald-200">
                    <Check size={13} strokeWidth={3} />
                    {paymentPurpose === 'DEMAND_NOTE' ? 'Permit Granted' : 'Submitted (Under Review)'}
                  </span>
                </div>
              </div>

              {/* Verified Documents & Receipts Download Section */}
              <div className="rounded-2xl border border-[#d6e5f8] bg-[#f8fafc] p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-ink font-bold text-caption uppercase tracking-wider">
                  <FileCheck size={15} className="text-primary-700" />
                  <span>Official Government Receipts & Passes</span>
                </div>

                <div className="space-y-2">
                  {/* GRAS e-Challan Receipt */}
                  <button
                    type="button"
                    onClick={() => {
                      const content = `================================================================================
GOVERNMENT OF MAHARASHTRA — GRAS e-CHALLAN RECEIPT
CYBER TREASURY PAYMENT ACKNOWLEDGEMENT (MH-GRAS)
================================================================================
Challan Ref (GRN)      : MH000242672202627E
CIN Number             : 02003942026090389173
Date & Time            : ${new Date().toLocaleString('en-IN')}
Major Head / Account   : 0853 - Non-Ferrous Mining & Metallurgical Industries
Department             : Directorate of Geology and Mining
--------------------------------------------------------------------------------
Applicant / Entity     : ${(settled ?? application).applicant.fullName}
Application Ref No     : ${(settled ?? application).applicationNumber}
Plot / Survey Location : Gat No-${(settled ?? application).surveyNumber}, ${(settled ?? application).village}
Mineral Type & Volume  : Stone / Excavation (${formatQuantity((settled ?? application).estimatedQuantity)})
--------------------------------------------------------------------------------
Payment Head           : ${paymentPurpose === 'APPLICATION_FEE' ? 'Application Fee & Stamp Duty' : 'Mineral Extraction Royalty'}
Challan Amount Paid    : ${formatMoney(paymentPurpose === 'APPLICATION_FEE' ? appFeeBreakdown.totalFee : grasDemandAmount)}
Payment Status         : SUCCESS / TREASURY SCROLL VERIFIED
================================================================================`;
                      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `GRAS_eChallan_${(settled ?? application).applicationNumber}.txt`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white p-3 text-body-sm font-semibold text-[#1241a6] shadow-2xs hover:bg-neutral-50 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Receipt size={16} className="text-[#1241a6]" />
                      <span>Download GRAS e-Challan (GRN & CIN)</span>
                    </span>
                    <Download size={15} />
                  </button>

                  {/* MahaKhanij DMF & SI Receipt (Only for Demand Note) */}
                  {paymentPurpose === 'DEMAND_NOTE' && (
                    <button
                      type="button"
                      onClick={() => {
                        const content = `================================================================================
MAHAKHANIJ PORTAL — TAX INVOICE & DMF TRUST RECEIPT
GOVERNMENT OF MAHARASHTRA / DISTRICT COLLECTORATE
================================================================================
Transaction Number     : BB5167841AE0492457C9BF1F
Transaction Date       : ${new Date().toLocaleString('en-IN')}
Lessee / Payer Entity  : ${(settled ?? application).applicant.fullName}
Application Ref No     : ${(settled ?? application).applicationNumber}
--------------------------------------------------------------------------------
FEE HEADS BREAKDOWN:
1. District DMF (10%)  : ${formatMoney(demandNoteSplit?.mahakhanij.dmf || { amount: 220, currency: 'INR' })}
2. SI Charges          : ${formatMoney(demandNoteSplit?.mahakhanij.siCharges || { amount: 250, currency: 'INR' })}
3. SI Tax (18% GST)    : ${formatMoney(demandNoteSplit?.mahakhanij.siTax || { amount: 45, currency: 'INR' })}
4. District TCS (2%)   : ${formatMoney(demandNoteSplit?.mahakhanij.tcs || { amount: 44, currency: 'INR' })}
--------------------------------------------------------------------------------
Total Portal Amount    : ${formatMoney(mahakhanijDemandAmount)}
Payment Status         : VERIFIED & SETTLED
================================================================================`;
                        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `MahaKhanij_DMF_Receipt_${(settled ?? application).applicationNumber}.txt`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                      }}
                      className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white p-3 text-body-sm font-semibold text-[#15803d] shadow-2xs hover:bg-neutral-50 active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <FileCheck size={16} className="text-[#15803d]" />
                        <span>Download MahaKhanij DMF & Tax Invoice</span>
                      </span>
                      <Download size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs">
              <p className="text-body text-ink font-semibold">Payment was cancelled or declined.</p>
              <p className="mt-1 text-caption text-ink-secondary">
                No amount was deducted from your account. You can retry the transaction safely.
              </p>
            </div>
          )}

          <div className="pt-2 space-y-2">
            {!succeeded && (
              <Button size="lg" fullWidth onClick={() => setStage('SUMMARY')}>
                Try Again
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
              {succeeded ? 'Return to Application Overview →' : 'Back to Application'}
            </Button>
          </div>
        </div>
      </Screen>
    );
  }

  /* ============================================================================
   * 1. STAGE 1: FIRST TIME APPLICATION SUBMISSION (GRAS PAYMENT ONLY)
   * ============================================================================ */
  if (paymentPurpose === 'APPLICATION_FEE' && application) {
    return (
      <Screen
        title="Application Fee Payment"
        subtitle={application.applicationNumber || 'Statutory Assessment'}
        onBack
        footer={
          <button
            type="button"
            onClick={() => startPayment('GRAS', false)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#15803d] py-3.5 px-4 text-body font-bold text-white shadow-md hover:bg-[#166534] active:scale-[0.99] transition-all cursor-pointer"
          >
            <span>₹</span>
            <span>Pay application fee · {formatMoney(appFeeBreakdown.totalFee)}</span>
          </button>
        }
      >
        {query.loading && <LoadingState variant="list" rows={3} />}
        {query.error && <ErrorState onRetry={query.reload} />}

        <div className="px-4 py-5 pb-8 space-y-4 bg-white">
          {/* Main Assessment Card Matching Reference 2 */}
          <div className="rounded-3xl border border-emerald-300 bg-[#f0fdf4] p-4.5 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-caption font-bold uppercase tracking-wider text-emerald-900">
                APPLICATION FEE & STATUTORY ASSESSMENT
              </h3>
              <span className="flex size-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-body-sm font-bold">
                ₹
              </span>
            </div>

            <p className="mt-1.5 text-caption text-emerald-800/90 leading-relaxed">
              Pay the statutory application fee to submit your excavation proposal. The proposal is forwarded to the mining officer as soon as payment succeeds.
            </p>

            {/* Inner White Breakdown Card */}
            <div className="mt-3.5 rounded-2xl bg-white p-4 shadow-2xs border border-emerald-100 space-y-2.5 text-caption">
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Application No:</span>
                <span className="font-mono font-bold text-ink">{application.applicationNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Applicant / Lessee:</span>
                <span className="font-medium text-ink">{application.applicant.fullName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Proposed Quantity:</span>
                <span className="font-medium text-ink tabular">{quantityValue} Brass</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Statutory Fee:</span>
                <span className="font-medium text-ink tabular">{formatMoney(appFeeBreakdown.baseFee)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Stamp Duty:</span>
                <span className="font-medium text-ink tabular">{formatMoney(appFeeBreakdown.stampDuty)}</span>
              </div>

              <div className="border-t border-neutral-100 pt-2.5 flex justify-between items-baseline font-bold text-ink">
                <span>Total Payable:</span>
                <span className="text-title font-bold text-emerald-700 tabular">
                  {formatMoney(appFeeBreakdown.totalFee)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Screen>
    );
  }

  /* ============================================================================
   * 2. STAGE 2: DEMAND NOTE PAYMENT (STRATEGIC 2-PAYMENT ARCHITECTURE)
   * ============================================================================ */
  if (paymentPurpose === 'DEMAND_NOTE' && application && demandNoteSplit) {
    const isStep1Done = grasPaid;
    const isStep2Done = mahakhanijPaid;

    return (
      <Screen
        title="Demand Note Settlement"
        subtitle={`DM Note: ${application.demandNote?.demandNoteNumber || 'DN/2026/004518'}`}
        onBack
        footer={
          !isStep1Done ? (
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => startPayment('GRAS', false)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#15803d] py-3.5 px-4 text-body font-bold text-white shadow-md hover:bg-[#166534] active:scale-[0.99] transition-all cursor-pointer"
              >
                <span>🏛️</span>
                <span>Step 1 of 2: Pay GRAS Royalty · {formatMoney(grasDemandAmount)}</span>
              </button>
              <p className="text-center text-[11px] text-neutral-500">
                Step 1 of 2 · Next: MahaKhanij DMF ({formatMoney(mahakhanijDemandAmount)})
              </p>
            </div>
          ) : !isStep2Done ? (
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => startPayment('MAHAKHANIJ', false)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#15803d] py-3.5 px-4 text-body font-bold text-white shadow-md hover:bg-[#166534] active:scale-[0.99] transition-all cursor-pointer"
              >
                <span>⛏️</span>
                <span>Step 2 of 2: Pay MahaKhanij DMF · {formatMoney(mahakhanijDemandAmount)}</span>
              </button>
              <p className="text-center text-[11px] text-emerald-700 font-medium">
                Step 2 of 2 · Final step to release excavation order & DigiTP
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() =>
                navigate(ROUTES.excavationApplication(application.id), { replace: true })
              }
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#15803d] py-3.5 px-4 text-body font-bold text-white shadow-md hover:bg-[#166534] active:scale-[0.99] transition-all cursor-pointer"
            >
              <Check size={18} strokeWidth={3} />
              <span>All Paid · View Permit & Generate Passes →</span>
            </button>
          )
        }
      >
        {query.loading && <LoadingState variant="list" rows={3} />}
        {query.error && <ErrorState onRetry={query.reload} />}

        <div className="px-4 py-4 pb-12 space-y-4 bg-[#f8fafc]">
          {/* ========================================================
              STRATEGIC UPFRONT NOTICE: 2 PAYMENTS EXPLAINED
             ======================================================== */}
          <div className="rounded-3xl border border-blue-200 bg-[#f0f7ff] p-4.5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1241a6] bg-blue-100 px-2 py-0.5 rounded-full">
                Statutory Mining Rule
              </span>
              <span className="text-caption font-bold text-ink">
                2 Separate Payments Required
              </span>
            </div>

            <div>
              <h2 className="text-body font-bold text-ink">
                Demand Note Settlement Roadmap
              </h2>
              <p className="mt-1 text-caption text-neutral-600 leading-relaxed">
                As per Maharashtra Minor Mineral Concession Rules, this demand note requires two separate legal settlements before your excavation order can be issued:
              </p>
            </div>

            {/* Visual Roadmap Pill Box */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-caption">
              <div
                className={cn(
                  'rounded-2xl p-3 border space-y-1 transition-all',
                  isStep1Done
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-white border-blue-200 text-ink shadow-2xs'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-500">Payment 1</span>
                  {isStep1Done && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">Done ✓</span>}
                </div>
                <p className="text-caption font-bold">🏛️ GRAS Treasury</p>
                <p className="text-[11px] text-neutral-500">Mineral Royalty Head</p>
                <p className="text-body-sm font-bold text-[#1241a6] tabular pt-0.5">
                  {formatMoney(grasDemandAmount)}
                </p>
              </div>

              <div
                className={cn(
                  'rounded-2xl p-3 border space-y-1 transition-all',
                  isStep2Done
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : isStep1Done
                    ? 'bg-white border-teal-300 text-ink shadow-2xs'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-400 opacity-80'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-400">Payment 2</span>
                  {isStep2Done ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">Done ✓</span>
                  ) : !isStep1Done ? (
                    <span className="text-[10px] text-neutral-400">Locked</span>
                  ) : (
                    <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-1.5 py-0.2 rounded">Ready</span>
                  )}
                </div>
                <p className="text-caption font-bold">⛏️ MahaKhanij Portal</p>
                <p className="text-[11px] text-neutral-500">DMF (10%) & Charges</p>
                <p className="text-body-sm font-bold text-teal-800 tabular pt-0.5">
                  {formatMoney(mahakhanijDemandAmount)}
                </p>
              </div>
            </div>

            <div className="border-t border-blue-200/60 pt-2 flex items-center justify-between text-caption font-bold text-ink">
              <span>Combined Total:</span>
              <span className="text-title-sm text-primary-700 tabular font-bold">
                {formatMoney(demandGrandTotal)}
              </span>
            </div>
          </div>

          {/* ========================================================
              CARD 1 OF 2: GRAS CYBER TREASURY (ROYALTY)
             ======================================================== */}
          <div
            className={cn(
              'rounded-3xl border p-4.5 shadow-xs transition-all',
              isStep1Done
                ? 'border-emerald-300 bg-[#f0fdf4]'
                : 'border-emerald-300 bg-[#f0fdf4]'
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-caption font-bold uppercase tracking-wider text-emerald-900">
                PAYMENT 1 OF 2 · GRAS CYBER TREASURY
              </h3>
              <span
                className={cn(
                  'flex size-7 items-center justify-center rounded-full text-body-sm font-bold',
                  isStep1Done ? 'bg-emerald-200 text-emerald-900' : 'bg-emerald-100 text-emerald-800'
                )}
              >
                🏛️
              </span>
            </div>

            <p className="mt-1.5 text-caption text-emerald-800/90 leading-relaxed">
              Direct treasury remittance to the Consolidated Fund of Maharashtra (Head 0853) for state mineral extraction rights.
            </p>

            {/* Inner White Breakdown Card */}
            <div className="mt-3.5 rounded-2xl bg-white p-4 shadow-2xs border border-emerald-100 space-y-2.5 text-caption">
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Government Portal:</span>
                <span className="font-semibold text-ink">gras.mahakosh.gov.in</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Major Accounting Head:</span>
                <span className="font-semibold text-ink">{demandNoteSplit.gras.head}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Sanctioned Volume / Royalty:</span>
                <span className="font-medium text-ink tabular">{formatMoney(demandNoteSplit.gras.amount)}</span>
              </div>

              <div className="border-t border-neutral-100 pt-2.5 flex justify-between items-baseline font-bold text-ink">
                <span>Payable to GRAS:</span>
                <span className="text-title font-bold text-emerald-700 tabular">
                  {formatMoney(grasDemandAmount)}
                </span>
              </div>
            </div>

            {/* If Paid: Verified Credentials & Receipt */}
            {isStep1Done && (
              <div className="mt-3 space-y-2">
                <div className="rounded-2xl bg-emerald-100/70 border border-emerald-200 p-3 text-[11px] text-emerald-950 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-emerald-800">Challan GRN:</span>
                    <strong className="font-mono font-bold">MH000242672202627E</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-800">CIN Number:</span>
                    <strong className="font-mono font-bold">02003942026090389173</strong>
                  </div>
                  <div className="flex justify-between border-t border-emerald-200/80 pt-1">
                    <span className="text-emerald-800">Treasury Scroll:</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <Check size={13} strokeWidth={3} /> Verified & Settled
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const content = `================================================================================
GOVERNMENT OF MAHARASHTRA — GRAS e-CHALLAN RECEIPT
CYBER TREASURY PAYMENT ACKNOWLEDGEMENT (MH-GRAS)
================================================================================
Challan Ref (GRN)      : MH000242672202627E
CIN Number             : 02003942026090389173
Date & Time            : ${new Date().toLocaleString('en-IN')}
Major Head / Account   : 0853 - Non-Ferrous Mining & Metallurgical Industries
Department             : Directorate of Geology and Mining
--------------------------------------------------------------------------------
Applicant / Entity     : ${application.applicant.fullName}
Application Ref No     : ${application.applicationNumber}
Plot / Survey Location : Gat No-${application.surveyNumber}, ${application.village}
Mineral Type & Volume  : Stone / Excavation (${formatQuantity(application.estimatedQuantity)})
--------------------------------------------------------------------------------
Payment Head           : Mineral Extraction Royalty
Challan Amount Paid    : ${formatMoney(grasDemandAmount)}
Payment Status         : SUCCESS / TREASURY SCROLL VERIFIED
================================================================================`;
                    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `GRAS_eChallan_${application.applicationNumber}.txt`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-emerald-300 bg-white p-2.5 text-caption font-semibold text-emerald-800 shadow-2xs hover:bg-emerald-50 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Receipt size={14} className="text-emerald-700" />
                    <span>Download GRAS e-Challan (GRN & CIN)</span>
                  </span>
                  <Download size={14} />
                </button>
              </div>
            )}
          </div>

          {/* ========================================================
              CARD 2 OF 2: MAHAKHANIJ PORTAL (DMF & CHARGES)
             ======================================================== */}
          <div
            className={cn(
              'rounded-3xl border p-4.5 shadow-xs transition-all',
              isStep2Done
                ? 'border-emerald-300 bg-[#f0fdf4]'
                : isStep1Done
                ? 'border-emerald-300 bg-[#f0fdf4]'
                : 'border-neutral-200 bg-[#f8fafc] opacity-75'
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className={cn('text-caption font-bold uppercase tracking-wider', isStep1Done || isStep2Done ? 'text-emerald-900' : 'text-neutral-600')}>
                PAYMENT 2 OF 2 · MAHAKHANIJ PORTAL & TRUST
              </h3>
              <span
                className={cn(
                  'flex size-7 items-center justify-center rounded-full text-body-sm font-bold',
                  isStep1Done || isStep2Done ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-500'
                )}
              >
                ⛏️
              </span>
            </div>

            <p className={cn('mt-1.5 text-caption leading-relaxed', isStep1Done || isStep2Done ? 'text-emerald-800/90' : 'text-neutral-500')}>
              District Mineral Foundation (10% Trust Fund), Supervision & Inspection, and statutory tax assessments.
            </p>

            {/* Inner White Breakdown Card */}
            <div className="mt-3.5 rounded-2xl bg-white p-4 shadow-2xs border border-neutral-100 space-y-2.5 text-caption">
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">District Mineral Foundation (10%):</span>
                <span className="font-medium text-ink tabular">{formatMoney(demandNoteSplit.mahakhanij.dmf)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Supervision & Inspection (SI):</span>
                <span className="font-medium text-ink tabular">{formatMoney(demandNoteSplit.mahakhanij.siCharges)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">SI Tax (18% GST):</span>
                <span className="font-medium text-ink tabular">{formatMoney(demandNoteSplit.mahakhanij.siTax)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">District cess / TCS (2%):</span>
                <span className="font-medium text-ink tabular">{formatMoney(demandNoteSplit.mahakhanij.tcs)}</span>
              </div>

              <div className="border-t border-neutral-100 pt-2.5 flex justify-between items-baseline font-bold text-ink">
                <span>Payable to MahaKhanij:</span>
                <span className="text-title font-bold text-emerald-700 tabular">
                  {formatMoney(mahakhanijDemandAmount)}
                </span>
              </div>
            </div>

            {/* If Paid: Verified Credentials & Receipt */}
            {isStep2Done ? (
              <div className="mt-3 space-y-2">
                <div className="rounded-2xl bg-emerald-100/70 border border-emerald-200 p-3 text-[11px] text-emerald-950 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-emerald-800">Transaction ID:</span>
                    <strong className="font-mono font-bold">BB5167841AE0492457C9BF1F</strong>
                  </div>
                  <div className="flex justify-between border-t border-emerald-200/80 pt-1">
                    <span className="text-emerald-800">DMF Portal Status:</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <Check size={13} strokeWidth={3} /> Reconciled & Cleared
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const content = `================================================================================
MAHAKHANIJ PORTAL — TAX INVOICE & DMF TRUST RECEIPT
GOVERNMENT OF MAHARASHTRA / DISTRICT COLLECTORATE
================================================================================
Transaction Number     : BB5167841AE0492457C9BF1F
Transaction Date       : ${new Date().toLocaleString('en-IN')}
Lessee / Payer Entity  : ${application.applicant.fullName}
Application Ref No     : ${application.applicationNumber}
--------------------------------------------------------------------------------
FEE HEADS BREAKDOWN:
1. District DMF (10%)  : ${formatMoney(demandNoteSplit.mahakhanij.dmf)}
2. SI Charges          : ${formatMoney(demandNoteSplit.mahakhanij.siCharges)}
3. SI Tax (18% GST)    : ${formatMoney(demandNoteSplit.mahakhanij.siTax)}
4. District TCS (2%)   : ${formatMoney(demandNoteSplit.mahakhanij.tcs)}
--------------------------------------------------------------------------------
Total Portal Amount    : ${formatMoney(mahakhanijDemandAmount)}
Payment Status         : VERIFIED & SETTLED
================================================================================`;
                    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `MahaKhanij_DMF_Receipt_${application.applicationNumber}.txt`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-emerald-300 bg-white p-2.5 text-caption font-semibold text-emerald-800 shadow-2xs hover:bg-emerald-50 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <FileCheck size={14} className="text-emerald-700" />
                    <span>Download MahaKhanij DMF & Tax Invoice</span>
                  </span>
                  <Download size={14} />
                </button>
              </div>
            ) : !isStep1Done ? (
              <div className="mt-3 rounded-2xl bg-neutral-100 p-2.5 text-center text-[11px] text-neutral-500 flex items-center justify-center gap-1.5 font-medium">
                <Lock size={12} />
                <span>Unlocks automatically once Step 1 (Royalty) is paid.</span>
              </div>
            ) : null}
          </div>
        </div>
      </Screen>
    );
  }

  return null;
}
