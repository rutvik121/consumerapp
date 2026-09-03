import { useEffect, useState } from 'react';
import { Download, FileCheck, ShieldCheck, X } from 'lucide-react';
import type { Delivery } from '@/domain';
import { formatQuantity } from '@/rules';
import { Button } from '@/design-system';

interface DigiTpPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery?: Delivery | null;
  customData?: {
    digiTpNumber?: string;
    vehicleNumber?: string;
    driverName?: string;
    driverMobile?: string;
    ownerName?: string;
    ownerMobile?: string;
    plotName?: string;
    destination?: string;
    distance?: string;
    createdAt?: string;
    validUntil?: string;
    mineralType?: string;
    quantity?: string;
  };
}

export function DigiTpPassModal({
  isOpen,
  onClose,
  delivery,
  customData,
}: DigiTpPassModalProps) {
  const [downloading, setDownloading] = useState(false);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const digiTpNumber =
    customData?.digiTpNumber || delivery?.permit?.etpNumber || 'ETP/2026/MH/0436344';
  const vehicleNumber =
    customData?.vehicleNumber ||
    delivery?.vehicle?.registrationNumber ||
    'MH-15-BN-4402';
  const driverName =
    customData?.driverName || delivery?.vehicle?.driverName || 'Nitin Wagh';
  const driverMobile =
    customData?.driverMobile ||
    delivery?.vehicle?.driverMobileNumber ||
    '9689330214';
  const ownerName = customData?.ownerName || 'A K';
  const ownerMobile = customData?.ownerMobile || '6434234234';
  const plotName =
    customData?.plotName ||
    delivery?.permit?.sourceQuarryName ||
    'Godavari Sand Ghat';
  const destination =
    customData?.destination ||
    delivery?.permit?.destinationLabel ||
    'Plot 14, Pathardi Phata, Nashik';
  const distance = customData?.distance || '10.0KM';
  const createdAt = customData?.createdAt || '30/07/2026 02:33 PM';
  const validUntil =
    customData?.validUntil ||
    (delivery?.permit?.validUntil
      ? new Date(delivery.permit.validUntil).toLocaleString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      : '04/09/2026, 06:28 am');
  const mineralType = customData?.mineralType || 'Stone';
  const quantity =
    customData?.quantity ||
    (delivery ? formatQuantity(delivery.dispatchedQuantity) : '12 MT');

  const handleDownload = () => {
    setDownloading(true);
    try {
      const content = `=====================================================
GOVERNMENT OF MAHARASHTRA
DEPARTMENT OF MINES & GEOLOGY
ELECTRONIC TRANSIT PASS (DigiTP)
=====================================================
DigiTP No              : ${digiTpNumber}
Status                 : VERIFIED & ACTIVE
-----------------------------------------------------
Vehicle Number         : ${vehicleNumber}
Vehicle Driver Name    : ${driverName}
Driver Mobile Number   : ${driverMobile}
Owner Name             : ${ownerName}
Owner Mobile Number    : ${ownerMobile}
Plot Name / Quarry     : ${plotName}
Destination            : ${destination}
Distance (Km)          : ${distance}
Created Date & Time    : ${createdAt}
Validity Date & Time   : ${validUntil}
Minor-Mineral Type     : ${mineralType}
Quantity (Brass / MT)  : ${quantity}
-----------------------------------------------------
Department of Mines & Geology Verified Transit Pass
Authorized for transport within specified route & time.
=====================================================`;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DigiTP_${digiTpNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setDownloading(false), 500);
    }
  };

  const fields = [
    { label: 'Vehicle Number', value: vehicleNumber, isMonospace: true },
    { label: 'Vehicle Driver Name', value: driverName },
    { label: 'Driver Mobile Number', value: driverMobile, isMonospace: true },
    { label: 'Owner Name', value: ownerName },
    { label: 'Owner Mobile Number', value: ownerMobile, isMonospace: true },
    { label: 'Plot Name', value: plotName },
    { label: 'Destination', value: destination },
    { label: 'Distance (Km)', value: distance },
    { label: 'Created date and time of DigiTP', value: createdAt },
    { label: 'DigiTP validity date and time', value: validUntil },
    { label: 'Minor-Mineral Type', value: mineralType },
    { label: 'Quantity(Brass)', value: quantity, isBold: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card Styled in App Theme */}
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-line bg-surface shadow-xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header with theme colors */}
        <div className="border-b border-line bg-[#f8fafc] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                <FileCheck size={16} />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary-700">
                  e-Transit Pass
                </p>
                <h2 className="text-title-sm font-bold tracking-tight text-ink">
                  DigiTP No : <span className="font-mono text-primary-800">{digiTpNumber}</span>
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex size-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="max-h-[62vh] overflow-y-auto px-5 py-3 divide-y divide-neutral-100">
          {fields.map((field, idx) => (
            <div key={idx} className="flex justify-between items-start gap-3 py-2 text-body-sm">
              <span className="text-ink-secondary font-medium leading-tight max-w-[45%] text-[13px]">
                {field.label}
              </span>
              <span
                className={`text-right text-ink text-[13px] leading-tight ${
                  field.isMonospace ? 'font-mono font-bold text-ink' : 'font-semibold'
                } ${field.isBold ? 'text-primary-800 font-bold' : ''}`}
              >
                {field.value}
              </span>
            </div>
          ))}
        </div>

        {/* Verified Badge */}
        <div className="border-t border-line bg-neutral-50/70 px-5 py-2 flex items-center justify-center gap-1.5 text-caption font-semibold text-emerald-700">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Department of Mines & Geology Verified</span>
        </div>

        {/* Footer Actions with Standard Theme Buttons */}
        <div className="border-t border-line bg-surface p-4 flex items-center gap-3">
          <Button
            variant="primary"
            fullWidth
            loading={downloading}
            onClick={handleDownload}
            leftIcon={<Download size={16} />}
          >
            Download
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
