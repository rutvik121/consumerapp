import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  ApplicationDocumentKind,
  ExcavationMethod,
  GeoPoint,
  IdProofType,
  LandType,
  Organization,
  User,
} from '@/domain';
import {
  APPLICATION_STEPS,
  missingRequiredDocuments,
  type ApplicationDraft,
  type ApplicationStep,
  validateApplicationStep,
} from '@/rules';
import { temporaryExcavationRepository } from '@/data';
import { ROUTES } from '@/navigation';
import type { OperatingContext } from '@/state';
import type { AttachedDocument } from './DocumentChecklist';

export interface UseApplicationFormOptions {
  user: User | null;
  organization: Organization | null;
  context: OperatingContext | null;
  draftId?: string | null;
}

/**
 * ALL OF THE FORM'S STATE, IN ONE PLACE AND OUT OF THE SCREEN.
 *
 * Supports creating new applications and resuming saved drafts seamlessly.
 */
export function useApplicationForm({ user, organization, context, draftId }: UseApplicationFormOptions) {
  const navigate = useNavigate();

  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<AttachedDocument[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [draft, setDraft] = useState<ApplicationDraft>(() => initialDraft(user, organization));

  useEffect(() => {
    if (!draftId) return;
    let cancelled = false;
    void temporaryExcavationRepository.getById(draftId).then((existing) => {
      if (cancelled || !existing) return;

      setDraft((prev) => ({
        ...prev,
        fullName: existing.applicant.fullName || prev.fullName,
        mobileNumber: existing.applicant.mobileNumber || prev.mobileNumber,
        email: existing.applicant.email || prev.email,
        panNumber: existing.applicant.panNumber || prev.panNumber,
        aadhaarNumber: existing.applicant.aadhaarNumber || prev.aadhaarNumber,
        gstNumber: existing.applicant.gstNumber || prev.gstNumber,
        idProofType: existing.applicant.idProofType || prev.idProofType,
        idProofNumber: existing.applicant.idProofNumber || prev.idProofNumber,
        alternatePhone: existing.applicant.alternatePhone || prev.alternatePhone,
        registeredAddressLine: existing.applicant.registeredAddress?.line1 || prev.registeredAddressLine,
        registeredTaluka: existing.applicant.registeredAddress?.taluka || prev.registeredTaluka,
        registeredDistrict: existing.applicant.registeredAddress?.district || prev.registeredDistrict,
        registeredPincode: existing.applicant.registeredAddress?.pincode || prev.registeredPincode,

        /* Proposal */
        mineralId: existing.mineralId || prev.mineralId,
        estimatedQuantity: existing.estimatedQuantity.value || prev.estimatedQuantity,
        excavationQuantityBrass: Math.round(existing.estimatedQuantity.value / 4.5) || prev.excavationQuantityBrass,
        excavationMethod: existing.excavationMethod || prev.excavationMethod,
        depthInMetres: existing.depthInMetres ?? prev.depthInMetres,
        fromDate: existing.fromDate || prev.fromDate,
        toDate: existing.toDate || prev.toDate,
        purpose: existing.purpose || prev.purpose,
        reasonForApplying: existing.purpose || prev.reasonForApplying,

        /* Location */
        districtCode: existing.siteAddress.district || prev.districtCode,
        districtName: existing.siteAddress.district || prev.districtName,
        talukaCode: existing.siteAddress.taluka || prev.talukaCode,
        talukaName: existing.siteAddress.taluka || prev.talukaName,
        villageCode: existing.village || prev.villageCode,
        villageName: existing.village || prev.villageName,
        surveyNumber: existing.surveyNumber || prev.surveyNumber,
        landType: existing.landType || prev.landType,
        totalPlotAreaHectare: existing.areaInSqm ? existing.areaInSqm / 10000 : prev.totalPlotAreaHectare,
        siteGeo: existing.siteGeo || prev.siteGeo,
        surveyEntries: [
          {
            id: 'survey-1',
            surveyNumber: existing.surveyNumber || '142/1',
            areaInHectares: existing.areaInSqm ? existing.areaInSqm / 10000 : 0.75,
            sevenTwelveAttached: true,
            ownerApprovalAttached: true,
          },
        ],
      }));

      if (existing.documents && existing.documents.length > 0) {
        setDocuments(
          existing.documents.map((d) => ({
            kind: d.kind,
            documentType: d.documentType,
            fileName: d.fileName,
            ...(d.documentNumber ? { documentNumber: d.documentNumber } : {}),
          })),
        );
      }

      // Resume from the exact step:
      // If missing mandatory documents -> jump to Step 3 (DOCUMENTS)
      // If all mandatory docs attached -> jump to Step 4 (REVIEW)
      const missingMandatory = missingRequiredDocuments(existing.documents.map((d) => d.kind));
      if (missingMandatory.length === 0 && existing.documents.length > 0) {
        setStepIndex(4); // REVIEW
      } else {
        setStepIndex(3); // DOCUMENTS
      }
    });
    return () => {
      cancelled = true;
    };
  }, [draftId]);

  const step: ApplicationStep = APPLICATION_STEPS[stepIndex] ?? 'APPLICANT';
  const attachedKinds = useMemo(
    () => documents.map((document) => document.kind),
    [documents],
  );

  function update<K extends keyof ApplicationDraft>(key: K, value: ApplicationDraft[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: '' }));
  }

  /** Applies several fields at once — used when the map pin fills the cascade. */
  function patch(values: Partial<ApplicationDraft>) {
    setDraft((previous) => ({ ...previous, ...values }));
    setErrors((previous) => {
      const cleared = { ...previous };
      for (const key of Object.keys(values)) delete cleared[key];
      return cleared;
    });
  }

  function attach(kind: ApplicationDocumentKind, documentType: string, documentNumber?: string) {
    /* ==== PROTOTYPE ONLY — a real build opens the device file picker ==== */
    setDocuments((all) => [
      ...all.filter((document) => document.kind !== kind),
      {
        kind,
        documentType,
        fileName: `${kind.toLowerCase().replace(/_/g, '-')}.pdf`,
        ...(documentNumber ? { documentNumber } : {}),
      },
    ]);
    setErrors((previous) => ({ ...previous, documents: '' }));
    /* ==== end prototype block ==== */
  }

  function detach(kind: ApplicationDocumentKind) {
    setDocuments((all) => all.filter((document) => document.kind !== kind));
  }

  function goToStep(target: ApplicationStep) {
    const index = APPLICATION_STEPS.indexOf(target);
    if (index >= 0) setStepIndex(index);
  }

  function next(): void {
    const found = validateApplicationStep(step, draft, attachedKinds);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    if (stepIndex < APPLICATION_STEPS.length - 1) setStepIndex((index) => index + 1);
  }

  function back(): boolean {
    if (stepIndex === 0) return false;
    setStepIndex((index) => index - 1);
    return true;
  }

  /**
   * Creates the application as a DRAFT and, when paying, hands off to payment.
   */
  async function persist(goToPayment: boolean): Promise<void> {
    if (goToPayment) {
      const found = validateApplicationStep('REVIEW', draft, attachedKinds);
      setErrors(found);
      if (Object.keys(found).length > 0) return;
    }

    if (!organization) return;
    const ready = toCreateInput(draft, goToPayment && draft.declarationAccepted);
    if (!ready) return;

    setSubmitting(true);
    try {
      const application = await temporaryExcavationRepository.create({
        organizationId: organization.id,
        // Attached from context, never asked for.
        ...(context?.projectId ? { projectId: context.projectId } : {}),
        ...(context?.packageId ? { packageId: context.packageId } : {}),
        ...ready,
        documents: documents.map((document) => ({
          kind: document.kind,
          fileName: document.fileName,
          documentType: document.documentType,
          ...(document.documentNumber ? { documentNumber: document.documentNumber } : {}),
        })),
      });

      navigate(
        goToPayment
          ? ROUTES.applicationPayment(application.id, 'application-fee')
          : ROUTES.excavationApplication(application.id),
        { replace: true },
      );
    } finally {
      setSubmitting(false);
    }
  }

  return {
    draft,
    errors,
    documents,
    attachedKinds,
    step,
    stepIndex,
    totalSteps: APPLICATION_STEPS.length,
    submitting,
    update,
    patch,
    attach,
    detach,
    next,
    back,
    goToStep,
    persist,
  };
}

/** An empty form, with everything the app already knows filled in. */
function initialDraft(user: User | null, organization: Organization | null): ApplicationDraft {
  const registered = organization?.address;

  return {
    fullName: user?.fullName ?? 'Satish Garg',
    mobileNumber: user?.mobileNumber ?? '9822014576',
    landlineNumber: '',
    email: 'satish@gmail.com',
    panNumber: 'ANDPG4491M',
    aadhaarNumber: '',
    gstNumber: '27ANDPG4491M1Z4',
    idProofType: 'PAN',
    idProofNumber: 'ANDPG4491M',
    alternatePhone: '',
    registeredAddressLine: registered?.line1 ?? 'Senapati Bapat Road',
    registeredTaluka: registered?.taluka ?? 'Haveli',
    registeredDistrict: registered?.district ?? 'Pune',
    registeredPincode: registered?.pincode ?? '411016',

    /* 2 · Proposal & Excavation */
    applicationType: 'QUARRY_TEMPORARY_PLOT',
    leaseType: 'TEMPORARY',
    proposalLevel: 'DISTRICT_LEVEL',
    mineralId: '',
    excavationQuantityBrass: 100,
    liftingPeriodDays: 60,
    reasonForApplying: 'Excavation for infrastructure foundation and material leveling',
    estimatedQuantity: 450,
    excavationMethod: 'SEMI_MECHANISED',
    depthInMetres: 4,
    fromDate: new Date().toISOString().slice(0, 10),
    toDate: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
    purpose: 'Commercial plot excavation and infrastructure fill',
    remarks: '',

    /* Project Details (Conditional on QUARRY_PROJECT_SELF_CONSUMPTION) */
    totalExcavationQuantityBrass: 500,
    projectType: 'GOVERNMENT',
    departmentName: '',
    officeName: '',
    workOrderNumber: '',
    workOrderDocumentName: '',
    projectCode: '',
    projectName: '',
    projectAddress: '',
    projectLatitude: '19.4500',
    projectLongitude: '73.3300',
    zeroRoyaltyScheme: 'NO',

    /* 3 · Quarry and location */
    category: 'RURAL',
    plotLocationType: 'INTERIOR',
    districtCode: '',
    districtName: '',
    talukaCode: '',
    talukaName: '',
    villageCode: '',
    villageName: '',
    surveyNumber: '142/1',
    subDivisionNumber: '',
    surveyEntries: [
      {
        id: 'survey-1',
        surveyNumber: '142/1',
        areaInHectares: 0.75,
        sevenTwelveAttached: true,
        ownerApprovalAttached: true,
      },
    ],
    totalPlotAreaHectare: 0.75,
    landType: 'PRIVATE',
    areaInSqm: 7500,
    addressLine: 'Plot 142/1, Sector 4',
    pincode: '411016',
    siteGeo: { latitude: 18.5204, longitude: 73.8567 },
    demandNoteOffice: 'DMO_PUNE',
    grasOfficeName: 'GRAS_PUNE',

    declarationAccepted: false,
  };
}

/**
 * Narrows the draft into the shape the repository accepts.
 */
function toCreateInput(draft: ApplicationDraft, declarationAccepted: boolean) {
  const siteGeo: GeoPoint = draft.siteGeo ?? { latitude: 18.5204, longitude: 73.8567 };
  const quantityValue = draft.excavationQuantityBrass ?? draft.estimatedQuantity ?? 100;

  return {
    applicant: {
      fullName: draft.fullName.trim(),
      mobileNumber: draft.mobileNumber.trim(),
      ...(draft.landlineNumber?.trim() ? { landlineNumber: draft.landlineNumber.trim() } : {}),
      ...(draft.email.trim() ? { email: draft.email.trim() } : {}),
      idProofType: (draft.idProofType || 'PAN') as IdProofType,
      idProofNumber: (draft.idProofNumber || draft.panNumber).trim().toUpperCase(),
      panNumber: draft.panNumber.trim().toUpperCase(),
      ...(draft.aadhaarNumber.trim() ? { aadhaarNumber: draft.aadhaarNumber.trim() } : {}),
      ...(draft.gstNumber.trim() ? { gstNumber: draft.gstNumber.trim().toUpperCase() } : {}),
      ...(draft.alternatePhone.trim() ? { alternatePhone: draft.alternatePhone.trim() } : {}),
      registeredAddress: {
        line1: draft.registeredAddressLine.trim() || 'Address',
        taluka: draft.registeredTaluka.trim() || 'Taluka',
        district: draft.registeredDistrict.trim() || 'District',
        state: 'Maharashtra',
        pincode: draft.registeredPincode.trim() || '400001',
      },
    },
    applicationType: draft.applicationType,
    leaseType: 'TEMPORARY' as const,
    proposalLevel: draft.proposalLevel,
    excavationQuantityBrass: draft.excavationQuantityBrass ?? 100,
    liftingPeriodDays: draft.liftingPeriodDays ?? 60,
    reasonForApplying: draft.reasonForApplying.trim(),

    mineralId: draft.mineralId || 'mineral-sand-01',
    estimatedQuantity: { value: quantityValue, unit: 'Brass' as const },
    excavationMethod: (draft.excavationMethod || 'SEMI_MECHANISED') as ExcavationMethod,
    purpose: draft.purpose.trim() || draft.reasonForApplying.trim(),
    ...(draft.remarks.trim() ? { remarks: draft.remarks.trim() } : {}),

    category: draft.category,
    plotLocationType: draft.plotLocationType,
    surveyEntries: draft.surveyEntries,
    totalPlotAreaHectare: draft.totalPlotAreaHectare ?? 0.75,
    demandNoteOffice: draft.demandNoteOffice,
    grasOfficeName: draft.grasOfficeName,

    siteAddress: {
      line1: draft.addressLine.trim() || 'Excavation Site',
      taluka: draft.talukaName || 'Taluka',
      district: draft.districtName || 'District',
      state: 'Maharashtra',
      pincode: draft.pincode.trim() || '400001',
    },
    siteGeo,
    village: draft.villageName || 'Village',
    surveyNumber: draft.surveyNumber.trim() || '1',
    ...(draft.subDivisionNumber.trim()
      ? { subDivisionNumber: draft.subDivisionNumber.trim() }
      : {}),
    landType: (draft.landType || 'PRIVATE') as LandType,
    areaInSqm: draft.areaInSqm ?? Math.round((draft.totalPlotAreaHectare ?? 0.75) * 10000),
    depthInMetres: draft.depthInMetres ?? 4,
    fromDate: draft.fromDate || new Date().toISOString().slice(0, 10),
    toDate: draft.toDate || new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
    declarationAccepted,
  };
}
