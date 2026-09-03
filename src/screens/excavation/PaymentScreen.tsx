import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  FileCheck,
  Lock,
  Receipt,
  ShieldAlert,
  Sparkles,
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

  // Breakdown for Demand Note vs Application Submission Fee
  const demandNoteSplit = application
    ? computeDetailedDemandNoteBreakdown(application.estimatedQuantity)
    : null;

  const appFeeBreakdown = calculateApplicationFeeBreakdown(quantityValue);

  const grasAmount: Money =
    paymentPurpose === 'APPLICATION_FEE'
      ? appFeeBreakdown.totalFee
      : demandNoteSplit?.gras.total || { amount: 2200, currency: 'INR' };

  const mahakhanijAmount: Money =
    paymentPurpose === 'APPLICATION_FEE'
      ? { amount: 118, currency: 'INR' } // MahaKhanij Portal & SI Charges
      : demandNoteSplit?.mahakhanij.total || { amount: 559, currency: 'INR' };

  const totalPayable: Money = {
    amount: grasAmount.amount + mahakhanijAmount.amount,
    currency: 'INR',
  };

  const amount: Money = currentChannel === 'GRAS' ? grasAmount : mahakhanijAmount;

  /* The hand-off simulation */
  useEffect(() => {
    if (stage !== 'REDIRECTING' || !payment) return;

    const timer = setTimeout(async () => {
      const isSuccess = !failNext;
      if (isSuccess) {
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
      } else {
        setStage('FAILED');
      }
    }, REDIRECT_MS);

    return () => clearTimeout(timer);
  }, [stage, payment, failNext, currentChannel]);

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
    currentChannel === 'GRAS'
      ? paymentPurpose === 'APPLICATION_FEE'
        ? 'GRAS Cyber Treasury (Statutory Application Fee & Stamp Duty)'
        : 'GRAS Cyber Treasury (State Royalty Head)'
      : 'MahaKhanij Payment Gateway (DMF & SI Portal Infrastructure)';

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
              : 'Processing District Mineral Foundation (DMF) and Supervision Inspection charges.'}
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

  /* ---------- Result (Both GRAS and MahaKhanij Settled) ---------- */
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
                  : 'Application & Charges Verified · Submitted!'
                : 'Payment Transaction Failed'}
            </h2>
            <p className="tabular mt-2 text-2xl font-bold text-primary-700">
              {formatMoney(totalPayable)}
            </p>
            <p className="mt-0.5 text-caption text-neutral-500">
              GRAS Treasury & MahaKhanij Portal Fully Reconciled
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
GRAS Amount Paid       : ${formatMoney(grasAmount)}
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

                  {/* MahaKhanij DMF & SI Receipt */}
                  <button
                    type="button"
                    onClick={() => {
                      const content = `================================================================================
MAHAKHANIJ PORTAL — TAX INVOICE & CHARGES RECEIPT
GOVERNMENT OF MAHARASHTRA / DISTRICT COLLECTORATE
================================================================================
Transaction Number     : BB5167841AE0492457C9BF1F
Transaction Date       : ${new Date().toLocaleString('en-IN')}
Lessee / Payer Entity  : ${(settled ?? application).applicant.fullName}
Application Ref No     : ${(settled ?? application).applicationNumber}
--------------------------------------------------------------------------------
Total Portal Amount    : ${formatMoney(mahakhanijAmount)}
Payment Status         : VERIFIED & SETTLED
================================================================================`;
                      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `MahaKhanij_Charges_Receipt_${(settled ?? application).applicationNumber}.txt`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white p-3 text-body-sm font-semibold text-[#15803d] shadow-2xs hover:bg-neutral-50 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <FileCheck size={16} className="text-[#15803d]" />
                      <span>Download MahaKhanij Portal & Tax Invoice</span>
                    </span>
                    <Download size={15} />
                  </button>
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

  /* ---------- GUIDED 2-STEP SEQUENTIAL WIZARD (FOR ALL PAYMENTS) ---------- */
  if (application) {
    const isStep1Done = grasPaid;
    const isStep2Done = mahakhanijPaid;

    return (
      <Screen
        title="Payment & Settlement Hub"
        subtitle={application.applicationNumber || 'Application Settlement'}
        onBack
        footer={
          !isStep1Done ? (
            <Button
              size="lg"
              fullWidth
              leftIcon={<Lock size={15} />}
              onClick={() => startPayment('GRAS', false)}
            >
              Step 1: Pay {formatMoney(grasAmount)} via GRAS
            </Button>
          ) : !isStep2Done ? (
            <Button
              size="lg"
              fullWidth
              leftIcon={<Sparkles size={15} />}
              onClick={() => startPayment('MAHAKHANIJ', false)}
            >
              Step 2: Pay {formatMoney(mahakhanijAmount)} via MahaKhanij →
            </Button>
          ) : (
            <Button
              size="lg"
              variant="primary"
              fullWidth
              onClick={() =>
                navigate(ROUTES.excavationApplication(application.id), { replace: true })
              }
            >
              Payments Settled · View Application →
            </Button>
          )
        }
      >
        {query.loading && <LoadingState variant="list" rows={3} />}
        {query.error && <ErrorState onRetry={query.reload} />}

        <div className="px-4 py-4 pb-12 space-y-4 bg-[#f8fafc]">
          {/* Step 1 Completion Success Banner */}
          {isStep1Done && !isStep2Done && (
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-3.5 flex items-center justify-between animate-fadeIn shadow-xs">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-emerald-600 text-white shrink-0">
                  <Check size={14} strokeWidth={3} />
                </span>
                <div>
                  <p className="text-body-sm font-bold text-emerald-950">Step 1 (GRAS Payment) Verified!</p>
                  <p className="text-[11px] text-emerald-800">Challan GRN: MH000242672202627E. Now complete Step 2 below.</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => startPayment('MAHAKHANIJ', false)}
              >
                Pay Step 2 →
              </Button>
            </div>
          )}

          {/* Top Plot & Sanction Banner */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-caption font-bold text-[#1241a6]">
                {paymentPurpose === 'DEMAND_NOTE'
                  ? `DM Note: ${application.demandNote?.demandNoteNumber || '936'}`
                  : `Proposal: ${application.applicationNumber}`}
              </span>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-[#1241a6] border border-blue-200">
                2-Step Settlement
              </span>
            </div>
            <h2 className="mt-1.5 text-body font-bold text-ink">
              {application.applicant.fullName}, Gat No-{application.surveyNumber}, {application.village}
            </h2>
            <div className="mt-2 flex items-center gap-4 text-caption text-neutral-500">
              <div>
                <span>Quantity: </span>
                <strong className="text-ink">{formatQuantity(application.estimatedQuantity)}</strong>
              </div>
              <div>
                <span>Total Amount: </span>
                <strong className="text-primary-700">{formatMoney(totalPayable)}</strong>
              </div>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-neutral-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex size-6 items-center justify-center rounded-full text-caption font-bold transition-all',
                  isStep1Done ? 'bg-emerald-600 text-white' : 'bg-[#1241a6] text-white ring-2 ring-blue-100'
                )}
              >
                {isStep1Done ? <Check size={13} strokeWidth={3} /> : '1'}
              </span>
              <span className={cn('text-caption font-semibold', isStep1Done ? 'text-emerald-700' : 'text-ink')}>
                1. GRAS Payment
              </span>
            </div>

            <ChevronRight size={16} className="text-neutral-300" />

            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex size-6 items-center justify-center rounded-full text-caption font-bold transition-all',
                  isStep2Done
                    ? 'bg-emerald-600 text-white'
                    : isStep1Done
                    ? 'bg-[#1241a6] text-white ring-2 ring-blue-100'
                    : 'bg-neutral-100 text-neutral-400'
                )}
              >
                {isStep2Done ? <Check size={13} strokeWidth={3} /> : '2'}
              </span>
              <span
                className={cn(
                  'text-caption font-semibold',
                  isStep2Done ? 'text-emerald-700' : isStep1Done ? 'text-ink' : 'text-neutral-400'
                )}
              >
                2. MahaKhanij Payment
              </span>
            </div>
          </div>

          {/* ========================================================
              STEP 1 CARD: GRAS CYBER TREASURY PAYMENT
             ======================================================== */}
          <div
            className={cn(
              'rounded-2xl border p-4 shadow-xs transition-all',
              isStep1Done ? 'border-emerald-200 bg-emerald-50/40' : 'border-[#bfd5fb] bg-white ring-2 ring-[#eef4fe]'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex size-7 items-center justify-center rounded-lg text-body-sm font-bold',
                    isStep1Done ? 'bg-emerald-100 text-emerald-800' : 'bg-[#eef4fe] text-[#1241a6]'
                  )}
                >
                  🏛️
                </span>
                <div>
                  <h3 className="text-body-sm font-bold text-ink">Step 1: GRAS Payment (Government Treasury)</h3>
                  <p className="text-[11px] text-neutral-500">Government Receipt Accounting System</p>
                </div>
              </div>
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-[11px] font-bold border',
                  isStep1Done
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-blue-50 text-[#1241a6] border-blue-200'
                )}
              >
                {isStep1Done ? 'Settled' : 'Payment Due'}
              </span>
            </div>

            {/* GRAS Table Breakdown */}
            <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-3 space-y-2 text-caption">
              {paymentPurpose === 'APPLICATION_FEE' ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500 font-medium">Application Fee:</span>
                    <span className="tabular font-medium text-ink">{formatMoney(appFeeBreakdown.baseFee)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500 font-medium">Stamp Duty:</span>
                    <span className="tabular font-medium text-ink">{formatMoney(appFeeBreakdown.stampDuty)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500 font-medium">Head:</span>
                    <span className="font-semibold text-ink">{demandNoteSplit?.gras.head}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500 font-medium">Assessed Royalty:</span>
                    <span className="tabular font-medium text-ink">{formatMoney(demandNoteSplit?.gras.amount || { amount: 2200, currency: 'INR' })}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center border-t border-dashed border-neutral-200 pt-2 font-bold text-ink">
                <span>Net Payable (GRAS Part A):</span>
                <span className="tabular text-primary-700 font-bold">{formatMoney(grasAmount)}</span>
              </div>
            </div>

            {/* If Paid: Show GRAS Audit History */}
            {isStep1Done ? (
              <div className="mt-3 rounded-xl bg-emerald-100/60 p-2.5 text-[11px] text-emerald-900 space-y-1">
                <div className="flex justify-between">
                  <span>Challan GRN:</span>
                  <strong className="font-mono">MH000242672202627E</strong>
                </div>
                <div className="flex justify-between">
                  <span>CIN Ref:</span>
                  <strong className="font-mono">02003942026090389173</strong>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-bold text-emerald-700">Challan Generated & Verified</span>
                </div>
              </div>
            ) : (
              <div className="mt-3">
                <Button
                  size="md"
                  fullWidth
                  leftIcon={<Lock size={14} />}
                  onClick={() => startPayment('GRAS', false)}
                >
                  Pay {formatMoney(grasAmount)} via GRAS →
                </Button>
                <p className="mt-1.5 text-center text-[10px] text-neutral-400">
                  Disclaimer: GRAS Payment Amount Non-Refundable (Direct Treasury Credit).
                </p>
              </div>
            )}
          </div>

          {/* ========================================================
              STEP 2 CARD: MAHAKHANIJ PORTAL PAYMENT (DMF & SI)
             ======================================================== */}
          <div
            className={cn(
              'rounded-2xl border p-4 shadow-xs transition-all',
              isStep2Done
                ? 'border-emerald-200 bg-emerald-50/40'
                : isStep1Done
                ? 'border-[#bfd5fb] bg-white ring-2 ring-[#eef4fe]'
                : 'border-neutral-200 bg-neutral-50 opacity-75'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex size-7 items-center justify-center rounded-lg text-body-sm font-bold',
                    isStep2Done
                      ? 'bg-emerald-100 text-emerald-800'
                      : isStep1Done
                      ? 'bg-[#eef4fe] text-[#1241a6]'
                      : 'bg-neutral-200 text-neutral-500'
                  )}
                >
                  ⛏️
                </span>
                <div>
                  <h3 className="text-body-sm font-bold text-ink">Step 2: MahaKhanij Payment (DMF & Charges)</h3>
                  <p className="text-[11px] text-neutral-500">District Mineral Foundation & Portal Services</p>
                </div>
              </div>
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-[11px] font-bold border',
                  isStep2Done
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : isStep1Done
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-neutral-200 text-neutral-600 border-neutral-300'
                )}
              >
                {isStep2Done ? 'Settled' : isStep1Done ? 'Ready to Pay' : 'Locked'}
              </span>
            </div>

            {/* MahaKhanij Table Breakdown */}
            <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-3 space-y-1.5 text-caption">
              {paymentPurpose === 'APPLICATION_FEE' ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">SI Inspection Charges:</span>
                    <span className="tabular font-medium text-ink">₹100</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">SI Tax (18% GST):</span>
                    <span className="tabular font-medium text-ink">₹18</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">District DMF (10% of Royalty):</span>
                    <span className="tabular font-medium text-ink">{formatMoney(demandNoteSplit?.mahakhanij.dmf || { amount: 220, currency: 'INR' })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">SI Charges (Transit monitoring):</span>
                    <span className="tabular font-medium text-ink">{formatMoney(demandNoteSplit?.mahakhanij.siCharges || { amount: 250, currency: 'INR' })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">SI Tax (18% GST on SI):</span>
                    <span className="tabular font-medium text-ink">{formatMoney(demandNoteSplit?.mahakhanij.siTax || { amount: 45, currency: 'INR' })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">District TCS (2%):</span>
                    <span className="tabular font-medium text-ink">{formatMoney(demandNoteSplit?.mahakhanij.tcs || { amount: 44, currency: 'INR' })}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center border-t border-dashed border-neutral-200 pt-2 font-bold text-ink">
                <span>Net Payable (Part B):</span>
                <span className="tabular text-primary-700 font-bold">{formatMoney(mahakhanijAmount)}</span>
              </div>
            </div>

            {/* If Paid: Show MahaKhanij Transaction History */}
            {isStep2Done ? (
              <div className="mt-3 rounded-xl bg-emerald-100/60 p-2.5 text-[11px] text-emerald-900 space-y-1">
                <div className="flex justify-between">
                  <span>Transaction Ref:</span>
                  <strong className="font-mono">BB5167841AE0492457C9BF1F</strong>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-bold text-emerald-700">Reconciled & Cleared</span>
                </div>
              </div>
            ) : isStep1Done ? (
              <div className="mt-3">
                <Button
                  size="md"
                  fullWidth
                  leftIcon={<Sparkles size={14} />}
                  onClick={() => startPayment('MAHAKHANIJ', false)}
                >
                  Pay {formatMoney(mahakhanijAmount)} via MahaKhanij →
                </Button>
              </div>
            ) : (
              <div className="mt-3 rounded-xl bg-neutral-100 p-2.5 text-center text-[11px] text-neutral-500 flex items-center justify-center gap-1.5">
                <Lock size={12} />
                <span>Complete Step 1 (GRAS Payment) to unlock Step 2.</span>
              </div>
            )}
          </div>
        </div>
      </Screen>
    );
  }

  return null;
}
