import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FileText,
  IndianRupee,
  Info,
  MapPin,
  ScrollText,
  Upload,
  User,
  Zap,
} from 'lucide-react';
import {
  awaitsApplicationFee,
  awaitsDemandNotePayment,
  formatMoney,
  formatQuantity,
  hasExcavationOrder,
  needsApplicantResponse,
  statusPresentation,
} from '@/rules';
import {
  Button,
  DetailList,
  ErrorState,
  LoadingState,
  StatusBadge,
  cn,
} from '@/design-system';
import { ROUTES, Screen } from '@/navigation';
import {
  mineralRepository,
  packageRepository,
  paymentRepository,
  projectRepository,
  temporaryExcavationRepository,
  useAsync,
} from '@/data';
import { useCopy } from '@/content';

type DetailTab = 'STATUS' | 'INFO' | 'ISSUED_DOCS' | 'UPLOADS';

export function ApplicationDetailsScreen() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const t = useCopy();
  const [activeTab, setActiveTab] = useState<DetailTab>('STATUS');
  const [downloading, setDownloading] = useState(false);

  const query = useAsync(async () => {
    if (!applicationId) throw new Error('An application is required');

    const application = await temporaryExcavationRepository.getById(applicationId);
    if (!application) throw new Error('Application not found');

    const [minerals, project, activePackage, payments] = await Promise.all([
      mineralRepository.listAll(),
      application.projectId
        ? projectRepository.getById(application.projectId)
        : Promise.resolve(null),
      application.packageId
        ? packageRepository.getById(application.packageId)
        : Promise.resolve(null),
      paymentRepository.listByApplication(application.id),
    ]);

    return { application, minerals, project, activePackage, payments };
  }, [applicationId]);

  const application = query.data?.application;
  const mineral = query.data?.minerals.find(
    (candidate) => candidate.id === application?.mineralId,
  );
  const payments = query.data?.payments ?? [];

  // Derive stage (1 = Submitted, 2 = Under Review, 3 = Demand Note, 4 = Permit Issued)
  let currentStageIndex = 1;
  if (application?.status === 'UNDER_REVIEW' || application?.status === 'QUERY_RAISED') {
    currentStageIndex = 2;
  } else if (application?.status === 'DEMAND_NOTE_ISSUED') {
    currentStageIndex = 3;
  } else if (application?.status === 'ORDER_ISSUED') {
    currentStageIndex = 4;
  }

  // Count of issued government documents available
  let issuedDocsCount = 0;
  if (application?.status !== 'DRAFT') issuedDocsCount += 1; // App Fee Receipt
  if (application?.demandNote) issuedDocsCount += 1; // Demand Note Notice
  if (application && (hasExcavationOrder(application) || payments.some((p) => p.purpose === 'DEMAND_NOTE'))) issuedDocsCount += 1; // Royalty Receipt
  if (application && hasExcavationOrder(application)) issuedDocsCount += 1; // Permit Certificate

  // 1. Download Official Excavation Permit
  const handleDownloadPermit = () => {
    if (!application || !application.excavationOrder) return;
    setDownloading(true);
    try {
      const content = `=====================================================
GOVERNMENT OF MAHARASHTRA
DEPARTMENT OF MINES & GEOLOGY
OFFICIAL TEMPORARY EXCAVATION & MOVEMENT PERMIT
=====================================================
Permit / Order No      : ${application.excavationOrder.orderNumber}
Application Ref No     : ${application.applicationNumber}
Issue Date             : ${formatDate(application.excavationOrder.issuedAt)}
Status                 : OFFICIAL EXTRACTION PERMIT GRANTED
-----------------------------------------------------
APPLICANT & ENTITY DETAILS
Applicant Name         : ${application.applicant.fullName}
Entity / Organization  : Maharashtra Infrastructure Corporation Ltd.
Authorized Signatory   : Aadhaar Verified (•••• 9104)
Mobile Number          : ${application.applicant.mobileNumber}
-----------------------------------------------------
MINERAL & EXCAVATION SPECIFICATIONS
Authorized Mineral     : ${mineral?.name || 'Murum / Earth'}
Permitted Quantity     : ${formatQuantity(application.excavationOrder.permittedQuantity)}
Excavation Method      : ${application.excavationMethod}
Survey / Plot Number   : ${application.surveyNumber}
Village & Taluka       : ${application.village}, ${application.siteAddress.taluka}
District               : ${application.siteAddress.district}
Land Classification    : ${application.landType}
Valid From             : ${formatDate(application.excavationOrder.validFrom)}
Valid Until            : ${formatDate(application.excavationOrder.validUntil)}
-----------------------------------------------------
FINANCIAL & ROYALTY SETTLEMENT
Demand Note Ref        : ${application.demandNote?.demandNoteNumber || 'DN/2026/004471'}
Royalty Amount Paid    : ${application.demandNote ? formatMoney(application.demandNote.totalAmount) : '₹4,03,200'}
GRAS Challan Ref       : MHA-GRAS-998241
Payment Status         : FULLY SETTLED (TREASURY VERIFIED)
-----------------------------------------------------
This is a digitally signed electronic permit authorized by the District Collectorate & Mining Officer, Government of Maharashtra.
=====================================================`;

      triggerDownload(content, `Permit_${application.excavationOrder.orderNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`);
    } finally {
      setTimeout(() => setDownloading(false), 500);
    }
  };

  // 2. Download Application Fee Receipt
  const handleDownloadApplicationFeeReceipt = () => {
    if (!application) return;
    const content = `=====================================================
GOVERNMENT OF MAHARASHTRA — GRAS e-RECEIPT
DEPARTMENT OF MINES & GEOLOGY
APPLICATION FEE PAYMENT ACKNOWLEDGEMENT
=====================================================
Challan / Receipt No   : MHA-GRAS-110294
Application Ref No     : ${application.applicationNumber}
Payment Date           : ${application.submittedAt ? formatDate(application.submittedAt) : '17 Aug 2026'}
Payment Mode           : Online Net Banking (State Bank of India)
-----------------------------------------------------
Fee Description        : Temporary Excavation Application Processing Fee
Amount Paid            : ₹1,000.00 (One Thousand Rupees Only)
Status                 : SUCCESS / TREASURY CREDITED
-----------------------------------------------------
Applicant Name         : ${application.applicant.fullName}
Entity                 : Maharashtra Infrastructure Corporation Ltd.
District               : ${application.siteAddress.district}
=====================================================`;
    triggerDownload(content, `Receipt_Application_Fee_${application.applicationNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`);
  };

  // 3. Download Demand Note Assessment Copy
  const handleDownloadDemandNoteAssessment = () => {
    if (!application || !application.demandNote) return;
    const content = `=====================================================
GOVERNMENT OF MAHARASHTRA
DEPARTMENT OF MINES & GEOLOGY
DEMAND NOTE & ROYALTY ASSESSMENT
=====================================================
Demand Note Number     : ${application.demandNote.demandNoteNumber}
Application Ref No     : ${application.applicationNumber}
Issued Date            : ${formatDate(application.demandNote.issuedAt)}
Due Date               : ${formatDate(application.demandNote.dueDate)}
-----------------------------------------------------
ASSESSMENT BREAKDOWN
Mineral Name           : ${mineral?.name || 'Murum / Earth'}
Estimated Volume       : ${formatQuantity(application.estimatedQuantity)}
${application.demandNote.breakdown.map((b) => `${b.label.padEnd(23)}: ${formatMoney(b.amount)}`).join('\n')}
-----------------------------------------------------
TOTAL AMOUNT PAYABLE   : ${formatMoney(application.demandNote.totalAmount)}
Payable To             : Government Treasury, Mahakhnij Account
-----------------------------------------------------
Issued by: District Mining Officer, ${application.siteAddress.district}
=====================================================`;
    triggerDownload(content, `Demand_Note_${application.demandNote.demandNoteNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`);
  };

  // 4. Download Royalty Payment Receipt
  const handleDownloadDemandNoteReceipt = () => {
    if (!application) return;
    const total = application.demandNote ? formatMoney(application.demandNote.totalAmount) : '₹4,03,200';
    const content = `=====================================================
GOVERNMENT OF MAHARASHTRA — GRAS e-CHALLAN RECEIPT
DEPARTMENT OF MINES & GEOLOGY
MINERAL EXTRACTION ROYALTY RECEIPT
=====================================================
GRAS Challan Number    : MHA-GRAS-998241
Demand Note Ref        : ${application.demandNote?.demandNoteNumber || 'DN/2026/004471'}
Application Ref No     : ${application.applicationNumber}
Payment Date           : ${formatDate(application.statusUpdatedAt || new Date().toISOString())}
Payment Mode           : NEFT/RTGS Treasury Transfer
-----------------------------------------------------
Total Royalty Paid     : ${total}
Status                 : TRANSACTION SUCCESSFUL (VERIFIED)
Bank Ref / UTR         : SBI-UTR-20260826998241
-----------------------------------------------------
Payer Entity           : Maharashtra Infrastructure Corporation Ltd.
Authorized Mineral     : ${mineral?.name || 'Murum / Earth'}
Site Survey No         : ${application.surveyNumber}, ${application.village}, ${application.siteAddress.taluka}
=====================================================`;
    triggerDownload(content, `Royalty_Receipt_${(application.demandNote?.demandNoteNumber || 'DN-001').replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`);
  };

  // 5. Download Attached Document Copy
  const handleDownloadAttachedDoc = (fileName: string, docType: string) => {
    const content = `=====================================================
MAHAKHANIJ COMPLIANCE DOCUMENT RECORD
=====================================================
Document Type          : ${docType}
File Name              : ${fileName}
Application Ref No     : ${application?.applicationNumber}
Uploaded At            : Verified Government Submission
Status                 : Digitally Archived
=====================================================`;
    triggerDownload(content, `${fileName}.txt`);
  };

  const triggerDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Screen
      title={t.excavation.title}
      {...(application ? { subtitle: application.applicationNumber } : {})}
      onBack
      footer={
        application && awaitsApplicationFee(application) ? (
          <Button
            size="lg"
            fullWidth
            leftIcon={<IndianRupee size={15} />}
            onClick={() =>
              navigate(ROUTES.applicationPayment(application.id, 'application-fee'))
            }
          >
            {t.excavation.payAndSubmit} · {formatMoney(application.applicationFee)}
          </Button>
        ) : application && awaitsDemandNotePayment(application) && application.demandNote ? (
          <button
            type="button"
            onClick={() => navigate(ROUTES.applicationPayment(application.id, 'demand-note'))}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 px-5 text-body font-bold text-white shadow-md transition-all active:scale-[0.98] cursor-pointer"
            style={{ backgroundColor: '#15803d', color: '#ffffff' }}
          >
            <IndianRupee size={17} className="text-white" />
            <span className="text-white">{t.excavation.payDemandNote} · {formatMoney(application.demandNote.totalAmount)}</span>
          </button>
        ) : undefined
      }
    >
      {query.loading && <LoadingState variant="list" rows={4} />}
      {query.error && <ErrorState onRetry={query.reload} />}

      {query.data && application && (
        <div className="space-y-4 bg-[#f8fafc] px-4 py-4 pb-12">
          {/* 1. Permanent Summary Header Card */}
          <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <StatusBadge {...statusPresentation.temporaryExcavation(application.status)} />
              <span className="font-mono text-caption text-neutral-500">
                {application.applicationNumber}
              </span>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <p className="tabular text-2xl font-bold text-ink">
                  {formatQuantity(application.estimatedQuantity)}
                </p>
                <p className="text-caption font-medium text-neutral-500">{mineral?.name}</p>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-neutral-400">Land Type</span>
                <p className="text-caption font-semibold text-ink">
                  {t.excavation.landTypes[application.landType]}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center gap-1.5 text-caption text-neutral-600">
              <MapPin size={13} className="text-neutral-400 shrink-0" />
              <span className="truncate">
                Survey No. <strong>{application.surveyNumber}</strong>, {application.village}, {application.siteAddress.taluka}
              </span>
            </div>
          </div>

          {/* 2. Interactive Category Tabs / Chips Bar */}
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-1">
            {[
              { id: 'STATUS', label: 'Status & Progress', icon: Zap },
              { id: 'INFO', label: 'Application Info', icon: Info },
              { id: 'ISSUED_DOCS', label: 'Issued Docs', icon: FileCheck, count: issuedDocsCount },
              { id: 'UPLOADS', label: 'Uploaded Files', icon: Upload, count: application.documents.length },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as DetailTab)}
                  className={cn(
                    'shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-caption font-semibold transition-all cursor-pointer',
                    isSelected
                      ? 'bg-[#1241a6] text-white shadow-xs'
                      : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
                  )}
                >
                  <Icon size={13} className={isSelected ? 'text-white' : 'text-neutral-500'} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={cn(
                        'flex size-4 items-center justify-center rounded-full text-[10px] font-bold',
                        isSelected ? 'bg-white/25 text-white' : 'bg-neutral-100 text-neutral-600'
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 3. Tab Content */}

          {/* TAB 1: STATUS & ACTIONS */}
          {activeTab === 'STATUS' && (
            <div className="space-y-4">
              {/* Visually Rich 4-Stage Milestone Journey Stepper */}
              <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
                  <div>
                    <h3 className="text-body-sm font-bold text-ink">Application Journey</h3>
                    <p className="text-[11px] text-neutral-500">Government Review & Grant Lifecycle</p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-xs',
                      application.status === 'ORDER_ISSUED'
                        ? 'bg-[#dcfce7] text-[#166534] border border-[#86efac]'
                        : application.status === 'DEMAND_NOTE_ISSUED'
                        ? 'bg-[#dcfce7] text-[#166534] border border-[#86efac]'
                        : application.status === 'QUERY_RAISED'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-[#eef4fe] text-[#1241a6] border border-[#bfd5fb]'
                    )}
                  >
                    Stage {currentStageIndex} of 4: {
                      currentStageIndex === 1
                        ? 'Submission'
                        : currentStageIndex === 2
                        ? 'Officer Review'
                        : currentStageIndex === 3
                        ? 'Demand Note'
                        : 'Permit Granted'
                    }
                  </span>
                </div>

                <div className="relative pl-1 space-y-6">
                  {/* Vertical Track Line */}
                  <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-neutral-200 -z-0" />

                  {/* Stage 1: Application Submission */}
                  <div className="relative flex items-start gap-3.5 z-10">
                    <span
                      className={cn(
                        'flex size-8 items-center justify-center rounded-full text-caption font-bold shrink-0 transition-all',
                        currentStageIndex > 1 || application.status !== 'DRAFT'
                          ? 'bg-[#1241a6] text-white ring-4 ring-[#eef4fe]'
                          : currentStageIndex === 1
                          ? 'bg-[#1241a6] text-white ring-4 ring-[#eef4fe]'
                          : 'bg-neutral-100 text-neutral-400'
                      )}
                    >
                      {currentStageIndex > 1 || application.status !== 'DRAFT' ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        '1'
                      )}
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <p className="text-body-sm font-bold text-ink">1. Application & Processing Fee</p>
                        <span className="text-[11px] font-semibold text-neutral-400">
                          {application.submittedAt ? formatDate(application.submittedAt) : 'Draft'}
                        </span>
                      </div>
                      <p className="text-[12px] text-neutral-500 mt-0.5">
                        {application.status === 'DRAFT'
                          ? 'Application fee of ₹1,000 pending payment to submit for review.'
                          : 'Application fee of ₹1,000 paid & verified via GRAS (Receipt: MHA-GRAS-110294).'}
                      </p>
                    </div>
                  </div>

                  {/* Stage 2: Department Review & Site Inspection */}
                  <div className="relative flex items-start gap-3.5 z-10">
                    <span
                      className={cn(
                        'flex size-8 items-center justify-center rounded-full text-caption font-bold shrink-0 transition-all',
                        currentStageIndex > 2
                          ? 'bg-[#1241a6] text-white ring-4 ring-[#eef4fe]'
                          : currentStageIndex === 2
                          ? application.status === 'QUERY_RAISED'
                            ? 'bg-amber-500 text-white ring-4 ring-amber-100'
                            : 'bg-[#1241a6] text-white ring-4 ring-[#eef4fe]'
                          : 'bg-neutral-100 text-neutral-400 ring-2 ring-white'
                      )}
                    >
                      {currentStageIndex > 2 ? <CheckCircle2 size={16} /> : '2'}
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <p className="text-body-sm font-bold text-ink">2. Mining Officer Review & Inspection</p>
                        {currentStageIndex === 2 && (
                          <span className={cn(
                            'text-[11px] font-bold px-2 py-0.5 rounded-full',
                            application.status === 'QUERY_RAISED' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          )}>
                            {application.status === 'QUERY_RAISED' ? 'Query Raised' : 'In Progress'}
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-neutral-500 mt-0.5">
                        Collectorate & Mining Officer boundary demarcation, 7/12 extract and environmental compliance check.
                      </p>
                    </div>
                  </div>

                  {/* Stage 3: Demand Note & Royalty Assessment */}
                  <div className="relative flex items-start gap-3.5 z-10">
                    <span
                      className={cn(
                        'flex size-8 items-center justify-center rounded-full text-caption font-bold shrink-0 transition-all',
                        currentStageIndex > 3
                          ? 'bg-[#15803d] text-white ring-4 ring-[#dcfce7]'
                          : currentStageIndex === 3
                          ? 'bg-[#15803d] text-white ring-4 ring-[#dcfce7]'
                          : 'bg-neutral-100 text-neutral-400 ring-2 ring-white'
                      )}
                    >
                      {currentStageIndex > 3 ? <CheckCircle2 size={16} /> : '3'}
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <p className="text-body-sm font-bold text-ink">3. Demand Note & Royalty Assessment</p>
                        {currentStageIndex === 3 && (
                          <span className="text-[11px] font-bold bg-[#dcfce7] text-[#166534] px-2 py-0.5 rounded-full">
                            Payment Due
                          </span>
                        )}
                        {currentStageIndex > 3 && (
                          <span className="text-[11px] font-bold text-[#15803d]">Settled</span>
                        )}
                      </div>
                      <p className="text-[12px] text-neutral-500 mt-0.5">
                        {application.demandNote
                          ? `Royalty assessment completed (${formatMoney(application.demandNote.totalAmount)}). Notice: ${application.demandNote.demandNoteNumber}.`
                          : 'Official assessment of mineral extraction royalty, DMF, and district cess.'}
                      </p>
                    </div>
                  </div>

                  {/* Stage 4: Excavation Order & Permit Issued */}
                  <div className="relative flex items-start gap-3.5 z-10">
                    <span
                      className={cn(
                        'flex size-8 items-center justify-center rounded-full text-caption font-bold shrink-0 transition-all',
                        currentStageIndex === 4
                          ? 'bg-[#15803d] text-white ring-4 ring-[#dcfce7]'
                          : 'bg-neutral-100 text-neutral-400 ring-2 ring-white'
                      )}
                    >
                      {currentStageIndex === 4 ? <CheckCircle2 size={16} /> : '4'}
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <p className="text-body-sm font-bold text-ink">4. Extraction Order & Permit Issued</p>
                        {currentStageIndex === 4 && (
                          <span className="text-[11px] font-bold bg-[#dcfce7] text-[#166534] px-2 py-0.5 rounded-full">
                            Permit Granted
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-neutral-500 mt-0.5">
                        {application.excavationOrder
                          ? `Official Order: ${application.excavationOrder.orderNumber} issued. Movement passes (DigiTP) authorized.`
                          : 'Official Government e-permit issued for extraction and electronic transit passes.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Query Raised Banner */}
              {needsApplicantResponse(application) && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle size={18} className="mt-0.5 text-amber-600 shrink-0" />
                    <div>
                      <h4 className="text-body-sm font-bold text-amber-900">{t.excavation.queryTitle}</h4>
                      <p className="mt-1 text-caption text-amber-800 leading-relaxed">
                        {application.statusRemarks || 'Please provide revised survey plan and updated boundary demarcation.'}
                      </p>
                      <p className="mt-2 text-[11px] font-medium text-amber-700">
                        {t.excavation.responseNote}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Demand Note Payable Box */}
              {awaitsDemandNotePayment(application) && application.demandNote && (
                <div
                  className="rounded-2xl border p-4 shadow-sm"
                  style={{ backgroundColor: '#f0fdf4', borderColor: '#86efac' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-caption font-bold uppercase tracking-wider" style={{ color: '#166534' }}>
                      Demand Note & Royalty Assessment
                    </span>
                    <span
                      className="flex size-6 items-center justify-center rounded-full"
                      style={{ backgroundColor: '#dcfce7', color: '#15803d' }}
                    >
                      <IndianRupee size={14} />
                    </span>
                  </div>
                  <p className="mt-1 text-body-sm" style={{ color: '#15803d' }}>
                    {t.excavation.demandNoteBody}
                  </p>

                  <div
                    className="mt-3 rounded-xl bg-white p-3.5 space-y-2 text-caption border"
                    style={{ borderColor: '#bbf7d0' }}
                  >
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Demand Note No:</span>
                      <span className="font-mono font-bold text-ink">{application.demandNote.demandNoteNumber}</span>
                    </div>
                    {application.demandNote.breakdown.map((line, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-neutral-500">{line.label}:</span>
                        <span className="tabular font-medium text-ink">{formatMoney(line.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-neutral-100 font-bold text-ink items-baseline">
                      <span>Total Payable:</span>
                      <span className="tabular font-bold text-base" style={{ color: '#15803d' }}>
                        {formatMoney(application.demandNote.totalAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3.5">
                    <button
                      type="button"
                      onClick={() => navigate(ROUTES.applicationPayment(application.id, 'demand-note'))}
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-body-sm font-bold shadow-xs transition-all active:scale-[0.99] cursor-pointer"
                      style={{ backgroundColor: '#15803d', color: '#ffffff' }}
                    >
                      <IndianRupee size={16} className="text-white" />
                      <span className="text-white">Pay Demand Note · {formatMoney(application.demandNote.totalAmount)}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Official Excavation Order Granted Banner */}
              {hasExcavationOrder(application) && application.excavationOrder && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <ScrollText size={16} />
                    </span>
                    <div>
                      <span className="text-[11px] font-bold uppercase text-emerald-800">
                        Official Government Order
                      </span>
                      <p className="font-mono text-body-sm font-bold text-ink">
                        {application.excavationOrder.orderNumber}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1 rounded-xl bg-white p-3 text-caption border border-emerald-100">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Permitted Volume:</span>
                      <span className="font-bold text-ink">{formatQuantity(application.excavationOrder.permittedQuantity)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Valid From:</span>
                      <span className="font-medium text-ink">{formatDate(application.excavationOrder.validFrom)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Valid Until:</span>
                      <span className="font-medium text-ink">{formatDate(application.excavationOrder.validUntil)}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <button
                      type="button"
                      disabled={downloading}
                      onClick={handleDownloadPermit}
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-body-sm font-bold text-white shadow-xs transition-all active:scale-[0.99] cursor-pointer"
                      style={{ backgroundColor: '#15803d', color: '#ffffff' }}
                    >
                      <Download size={16} className="text-white" />
                      <span className="text-white">Download Excavation Permit Certificate</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: APPLICATION INFO */}
          {activeTab === 'INFO' && (
            <div className="space-y-4">
              {/* Land & Site Details */}
              <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={16} className="text-[#1241a6]" />
                  <h3 className="text-caption font-bold tracking-wider text-neutral-500 uppercase">
                    Land & Site Details
                  </h3>
                </div>

                <DetailList
                  items={[
                    { label: 'Village', value: application.village },
                    { label: 'Taluka', value: application.siteAddress.taluka },
                    { label: 'District', value: application.siteAddress.district },
                    { label: 'Survey Number', value: application.surveyNumber, numeric: true },
                    { label: 'Land Classification', value: t.excavation.landTypes[application.landType] },
                    { label: 'Excavation Area', value: `${application.areaInSqm} sq m`, numeric: true },
                    { label: 'Max Depth', value: `${application.depthInMetres} metres`, numeric: true },
                    { label: 'Excavation Method', value: application.excavationMethod },
                    { label: 'Purpose', value: application.purpose },
                  ]}
                />
              </div>

              {/* Applicant & Entity Details */}
              <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <User size={16} className="text-[#1241a6]" />
                  <h3 className="text-caption font-bold tracking-wider text-neutral-500 uppercase">
                    Applicant & Entity
                  </h3>
                </div>

                <DetailList
                  items={[
                    { label: 'Authorized Person', value: application.applicant.fullName },
                    { label: 'Mobile Number', value: application.applicant.mobileNumber, numeric: true },
                    { label: 'ID Proof Type', value: `${application.applicant.idProofType} (${application.applicant.idProofNumber})` },
                    { label: 'Entity Name', value: 'Maharashtra Infrastructure Corporation Ltd.' },
                    { label: 'Registered Address', value: `${application.applicant.registeredAddress.line1}, ${application.applicant.registeredAddress.taluka}, ${application.applicant.registeredAddress.district}` },
                  ]}
                />
              </div>

              {/* Timeline & Project Linkage */}
              <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={16} className="text-[#1241a6]" />
                  <h3 className="text-caption font-bold tracking-wider text-neutral-500 uppercase">
                    Timeline & Project Linkage
                  </h3>
                </div>

                <DetailList
                  items={[
                    { label: 'Excavation From', value: formatDate(application.fromDate) },
                    { label: 'Excavation To', value: formatDate(application.toDate) },
                    ...(application.submittedAt ? [{ label: 'Submitted On', value: formatDate(application.submittedAt) }] : []),
                    { label: 'Last Status Update', value: formatDate(application.statusUpdatedAt) },
                    ...(query.data.project ? [{ label: 'Linked Project', value: query.data.project.name }] : []),
                    ...(query.data.activePackage ? [{ label: 'Contract Package', value: query.data.activePackage.name }] : []),
                  ]}
                />
              </div>
            </div>
          )}

          {/* TAB 3: ISSUED DOCS & RECEIPTS */}
          {activeTab === 'ISSUED_DOCS' && (
            <div className="space-y-3">
              {/* 1. Excavation Permit (if ORDER_ISSUED) */}
              {hasExcavationOrder(application) && application.excavationOrder && (
                <div className="rounded-2xl border border-[#86efac] bg-[#f0fdf4] p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-[#dcfce7] text-[#15803d] shrink-0">
                        <ScrollText size={18} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-body-sm font-bold text-ink truncate">Excavation Permit Certificate</p>
                        <p className="font-mono text-[11px] text-[#166534] truncate">{application.excavationOrder.orderNumber} · Active</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadPermit}
                      className="shrink-0 flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-bold text-white transition-all active:scale-95 cursor-pointer shadow-xs"
                      style={{ backgroundColor: '#15803d', color: '#ffffff' }}
                    >
                      <Download size={14} className="text-white" />
                      <span className="text-white">Download</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 2. Royalty Payment Receipt */}
              {(hasExcavationOrder(application) || payments.some((p) => p.purpose === 'DEMAND_NOTE')) && (
                <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-[#eef4fe] text-[#1241a6] shrink-0">
                        <IndianRupee size={18} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-body-sm font-bold text-ink truncate">Royalty Challan Receipt</p>
                        <p className="font-mono text-[11px] text-neutral-500 truncate">MHA-GRAS-998241 · {application.demandNote ? formatMoney(application.demandNote.totalAmount) : '₹4,03,200'}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadDemandNoteReceipt}
                      className="shrink-0 flex items-center gap-1.5 rounded-xl bg-[#1241a6] hover:bg-[#0f3484] text-white px-3.5 py-2 text-[12px] font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                    >
                      <Download size={14} />
                      <span>Receipt</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Department Demand Note Assessment Copy */}
              {application.demandNote && (
                <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-[#1241a6] shrink-0">
                        <FileText size={18} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-body-sm font-bold text-ink truncate">Department Demand Note Notice</p>
                        <p className="font-mono text-[11px] text-neutral-500 truncate">{application.demandNote.demandNoteNumber} · Assessment</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadDemandNoteAssessment}
                      className="shrink-0 flex items-center gap-1.5 rounded-xl bg-[#1241a6] hover:bg-[#0f3484] text-white px-3.5 py-2 text-[12px] font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                    >
                      <Download size={14} />
                      <span>Notice</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 4. Application Fee Receipt */}
              {application.status !== 'DRAFT' && (
                <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-[#1241a6] shrink-0">
                        <FileCheck size={18} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-body-sm font-bold text-ink truncate">Application Fee Receipt</p>
                        <p className="font-mono text-[11px] text-neutral-500 truncate">MHA-GRAS-110294 · ₹1,000 Paid</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadApplicationFeeReceipt}
                      className="shrink-0 flex items-center gap-1.5 rounded-xl bg-[#1241a6] hover:bg-[#0f3484] text-white px-3.5 py-2 text-[12px] font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                    >
                      <Download size={14} />
                      <span>Receipt</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: UPLOADED FILES */}
          {activeTab === 'UPLOADS' && (
            <div className="space-y-3">
              {application.documents.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200/90 bg-white p-8 text-center">
                  <Upload size={28} className="mx-auto text-neutral-300 mb-2" />
                  <p className="text-body-sm font-semibold text-ink">No Documents Attached</p>
                  <p className="text-caption text-neutral-400 mt-1">No compliance documents uploaded for this application.</p>
                </div>
              ) : (
                application.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 shrink-0">
                        <FileText size={18} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-body-sm font-semibold text-ink truncate">{doc.documentType}</p>
                        <p className="font-mono text-[11px] text-neutral-400 truncate">{doc.fileName}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadAttachedDoc(doc.fileName, doc.documentType)}
                      className="shrink-0 flex items-center gap-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3.5 py-2 text-[12px] font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      <Download size={14} />
                      <span>View</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </Screen>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
