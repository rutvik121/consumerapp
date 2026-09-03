import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileCheck,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import type { DiscrepancyReason, Quantity } from '@/domain';
import {
  assessDiscrepancy,
  formatQuantity,
  permitPayloadFor,
  verifyTransport,
  type VerificationOutcome,
} from '@/rules';
import {
  BottomSheet,
  ErrorState,
  LoadingState,
  QuantityInput,
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
import { QrScanPanel } from './QrScanPanel';

export function ReceiveDeliveryScreen() {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const user = useCurrentUser();
  const navigate = useNavigate();

  const [scanError, setScanError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<VerificationOutcome | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [isEditingQty, setIsEditingQty] = useState(false);
  const [receivedValue, setReceivedValue] = useState<number | null>(null);
  const [reason] = useState<DiscrepancyReason | ''>('');
  const [remarks] = useState('');
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
  const effectiveReceivedVal = receivedValue ?? delivery?.dispatchedQuantity.value ?? 0;
  const received: Quantity = { value: effectiveReceivedVal, unit };
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
    setReceivedValue(delivery.dispatchedQuantity.value);
    setShowCloseModal(true);
  }

  async function handleConfirmAndClose() {
    if (!delivery || !user || !outcome) return;

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
      setShowCloseModal(false);
    } finally {
      setSubmitting(false);
    }
  }

  const handleDownloadReceipt = () => {
    if (!delivery || !result) return;
    const content = `=====================================================
MAHAKHANIJ GOVERNMENT OF MAHARASHTRA
MINERAL TRANSIT PASS (DIGITP) CLOSURE & GOODS INWARD RECEIPT
=====================================================
DigiTP Number          : ${delivery.permit.etpNumber}
Vehicle Registration   : ${delivery.vehicle.registrationNumber}
Date & Time            : ${new Date().toLocaleString('en-IN')}
Status                 : TRANSIT PASS CLOSED / MATERIAL RECEIVED
-----------------------------------------------------
SUPPLIER & DESTINATION
Stockyard / Quarry     : ${delivery.permit.sourceQuarryName || 'Shree Ganesh Stone Quarry'}
Destination Project    : ${delivery.permit.destinationLabel || 'NH-48 Road Widening Site'}
Receiver Signatory     : ${user?.fullName || 'Site Incharge'}
-----------------------------------------------------
MATERIAL & QUANTITY BREAKDOWN
Mineral Name           : ${mineral?.name || 'Basalt Stone'}
Dispatched Quantity    : ${formatQuantity(result.receipt.dispatchedQuantity)}
Received Quantity      : ${formatQuantity(result.receipt.receivedQuantity)}
Discrepancy            : ${result.receipt.hasDiscrepancy ? 'SHORTAGE RECORDED' : 'NIL (EXACT LOAD)'}
-----------------------------------------------------
INVENTORY IMPACT
New Site Balance       : ${formatQuantity(result.availableQuantity)} ${mineral?.name || 'Basalt Stone'}
=====================================================
Official electronic goods inward verification record.`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DigiTP_Receipt_${delivery.permit.etpNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /* ---------- 1. Done & Closed Screen ---------- */
  if (result && delivery) {
    return (
      <Screen title="DigiTP Received & Closed">
        <div className="flex flex-col items-center px-4 py-8 text-center bg-[#f8fafc]">
          {/* Animated Success Icon */}
          <span className="mb-3.5 flex size-16 items-center justify-center rounded-full bg-[#dcfce7] text-[#15803d] shadow-sm">
            <CheckCircle2 size={34} />
          </span>

          <h2 className="text-title-lg font-bold text-ink">Transit Pass Closed Successfully</h2>
          <p className="mt-1 text-body-sm text-neutral-600 max-w-[36ch]">
            DigiTP <span className="font-mono font-bold text-ink">{delivery.permit.etpNumber}</span> has been verified and marked as received.
          </p>

          {/* Delivery & Material Receipt Summary Card */}
          <div className="mt-6 w-full rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100">
              <span className="text-[11px] font-bold uppercase text-neutral-500">
                Goods Inward Receipt
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-[11px] font-bold text-[#166534]">
                <FileCheck size={12} />
                Verified & Logged
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-caption">
              <div className="rounded-xl bg-neutral-50 p-2.5 border border-neutral-100">
                <span className="text-neutral-500 text-[11px]">Material Received</span>
                <p className="font-bold text-ink text-body-sm">{formatQuantity(result.receipt.receivedQuantity)}</p>
                <p className="text-[11px] text-neutral-500">{mineral?.name}</p>
              </div>

              <div className="rounded-xl bg-neutral-50 p-2.5 border border-neutral-100">
                <span className="text-neutral-500 text-[11px]">Vehicle Number</span>
                <p className="font-mono font-bold text-ink text-body-sm">{delivery.vehicle.registrationNumber}</p>
                <p className="text-[11px] text-neutral-500">{delivery.vehicle.driverName || 'Verified Driver'}</p>
              </div>
            </div>

            <div className="rounded-xl bg-[#eef4fe] p-3 border border-[#bfd5fb] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#1241a6] font-medium">Updated Site Inventory</span>
                <p className="text-body font-bold text-[#1241a6]">
                  {formatQuantity(result.availableQuantity)}
                </p>
              </div>
              <span className="text-caption font-semibold text-[#1241a6]">Available Now</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 w-full space-y-2.5">
            <button
              type="button"
              onClick={handleDownloadReceipt}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white py-3 px-4 text-body-sm font-bold text-ink shadow-xs hover:bg-neutral-50 active:scale-[0.99] cursor-pointer"
            >
              <Download size={16} />
              <span>Download Goods Inward Receipt</span>
            </button>

            <button
              type="button"
              onClick={() => navigate(ROUTES.home, { replace: true })}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 px-4 text-body font-bold text-white shadow-md active:scale-[0.99] cursor-pointer"
              style={{ backgroundColor: '#1241a6', color: '#ffffff' }}
            >
              <span>Done & Return to Home</span>
            </button>
          </div>
        </div>
      </Screen>
    );
  }

  return (
    <Screen
      title="Receive DigiTP Material"
      {...(delivery ? { subtitle: delivery.vehicle.registrationNumber } : {})}
      onBack={() => navigate(-1)}
    >
      {query.loading && <LoadingState variant="screen" />}
      {query.error && <ErrorState onRetry={query.reload} />}

      {query.data && delivery && (
        <div className="space-y-4 bg-[#f8fafc] px-4 py-4 pb-12">
          {/* Target Vehicle & Transit Pass Preview Card */}
          <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-[#eef4fe] text-[#1241a6]">
                  <Truck size={18} />
                </span>
                <div>
                  <span className="font-mono text-body-sm font-bold text-ink">
                    {delivery.vehicle.registrationNumber}
                  </span>
                  <p className="text-[11px] text-neutral-500">
                    DigiTP: <strong className="font-mono">{delivery.permit.etpNumber}</strong>
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-caption font-bold text-emerald-800">
                Arrived at Gate
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 pt-3 border-t border-neutral-100 text-caption">
              <div>
                <span className="text-[11px] text-neutral-400">Mineral Dispatched</span>
                <p className="font-bold text-ink">{formatQuantity(delivery.dispatchedQuantity)}</p>
                <p className="text-[11px] text-neutral-500">{mineral?.name}</p>
              </div>
              <div>
                <span className="text-[11px] text-neutral-400">Driver</span>
                <p className="font-semibold text-ink">{delivery.vehicle.driverName || 'Ramesh Shinde'}</p>
                <p className="text-[11px] text-neutral-500 tabular">{delivery.vehicle.driverMobileNumber || '9820194821'}</p>
              </div>
            </div>
          </div>

          {/* Scanner View Panel */}
          <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-xs overflow-hidden">
            <QrScanPanel
              onSubmit={handleScan}
              simulatedPayload={delivery.permit.qrPayload}
              error={scanError}
            />
          </div>

          {/* Direct Verification Confirmation Pop-up / Bottom Sheet */}
          <BottomSheet
            open={showCloseModal}
            onClose={() => setShowCloseModal(false)}
            title="DigiTP Verification & Pass Closure"
            description="Verify pass details and confirm arrival to credit site inventory."
          >
            <div className="p-4 space-y-4">
              {/* Green Verified Banner */}
              <div className="flex items-center gap-3 rounded-2xl bg-[#f0fdf4] p-3.5 border border-[#86efac]">
                <span className="flex size-10 items-center justify-center rounded-xl bg-[#dcfce7] text-[#15803d] shrink-0">
                  <ShieldCheck size={22} />
                </span>
                <div>
                  <h4 className="text-body-sm font-bold text-[#166534]">
                    Transit Pass Valid & Verified
                  </h4>
                  <p className="text-[12px] text-[#15803d]">
                    Authentic e-Permit issued by Mining Department, Maharashtra.
                  </p>
                </div>
              </div>

              {/* Transit Pass Details Card */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-3.5 space-y-2.5 text-caption">
                <div className="flex justify-between">
                  <span className="text-neutral-500">DigiTP Pass No:</span>
                  <span className="font-mono font-bold text-ink">{delivery.permit.etpNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Vehicle Registration:</span>
                  <span className="font-mono font-bold text-ink">{delivery.vehicle.registrationNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Mineral & Grade:</span>
                  <span className="font-semibold text-ink">{mineral?.name || 'Basalt Stone'}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-neutral-100">
                  <span className="text-neutral-500 font-medium">Quantity to Receive:</span>
                  <span className="tabular font-bold text-body-sm" style={{ color: '#15803d' }}>
                    {formatQuantity(received)}
                  </span>
                </div>
              </div>

              {/* Optional Discrepancy Adjustment Toggle */}
              {!isEditingQty ? (
                <button
                  type="button"
                  onClick={() => setIsEditingQty(true)}
                  className="text-[11px] font-semibold text-[#1241a6] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <AlertTriangle size={12} />
                  <span>Report shortage / weighment difference</span>
                </button>
              ) : (
                <div className="rounded-xl bg-neutral-50 p-3 border border-neutral-200 space-y-2">
                  <QuantityInput
                    label="Actual Weighed Quantity (MT)"
                    value={receivedValue}
                    unit={unit}
                    onChange={setReceivedValue}
                  />
                  {discrepancy?.hasDiscrepancy && (
                    <p className="text-[11px] text-amber-700 font-medium">
                      Difference: {formatQuantity(discrepancy.difference)} ({discrepancy.kind})
                    </p>
                  )}
                </div>
              )}

              {/* Single Primary Action: Confirm Receipt & Close DigiTP */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleConfirmAndClose}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 px-5 text-body font-bold text-white shadow-md active:scale-[0.98] transition-all cursor-pointer"
                  style={{ backgroundColor: '#15803d', color: '#ffffff' }}
                >
                  <CheckCircle2 size={18} className="text-white" />
                  <span className="text-white">
                    {submitting ? 'Closing Transit Pass...' : 'Confirm Receipt & Close DigiTP'}
                  </span>
                </button>
              </div>
            </div>
          </BottomSheet>
        </div>
      )}
    </Screen>
  );
}
