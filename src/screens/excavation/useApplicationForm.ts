import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ApplicationDocumentKind, GeoPoint, Organization, User } from '@/domain';
import {
  APPLICATION_STEPS,
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
}

/**
 * ALL OF THE FORM'S STATE, IN ONE PLACE AND OUT OF THE SCREEN.
 *
 * The screen renders steps; this decides what a step is, when it may be left,
 * and what the finished draft becomes. Keeping them apart is what stops a
 * five-step form from turning into a thousand-line component, and it is what
 * lets the Flutter team read the flow without reading any JSX.
 *
 * PRE-FILL, NOT RE-ASK. The applicant fields open populated from the signed-in
 * account and the organization's registered address, and stay editable. The
 * web form asks for them, so the mobile form shows them — but showing a known
 * answer for confirmation is not the same as asking a user for something the
 * app already knows.
 */
export function useApplicationForm({ user, organization, context }: UseApplicationFormOptions) {
  const navigate = useNavigate();

  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<AttachedDocument[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [draft, setDraft] = useState<ApplicationDraft>(() => initialDraft(user, organization));

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

  function attach(kind: ApplicationDocumentKind, documentType: string) {
    /* ==== PROTOTYPE ONLY — a real build opens the device file picker ==== */
    setDocuments((all) => [
      ...all.filter((document) => document.kind !== kind),
      { kind, documentType, fileName: `${kind.toLowerCase()}.pdf` },
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
   *
   * Nothing is submitted here. Paying the application fee is what submits it,
   * so this function's job ends at "there is now something to pay for".
   *
   * SAVING A DRAFT DOES NOT REQUIRE THE DECLARATION. Declaring that the
   * contents are true belongs with submitting them; asking for it to park a
   * half-finished form would be asking someone to vouch for nothing.
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
    fullName: user?.fullName ?? '',
    mobileNumber: user?.mobileNumber ?? '',
    email: (user && 'email' in user ? user.email : undefined) ?? '',
    idProofType: '',
    idProofNumber: '',
    alternatePhone: '',
    registeredAddressLine: registered?.line1 ?? '',
    registeredTaluka: registered?.taluka ?? '',
    registeredDistrict: registered?.district ?? '',
    registeredPincode: registered?.pincode ?? '',

    mineralId: '',
    estimatedQuantity: null,
    excavationMethod: '',
    depthInMetres: null,
    fromDate: '',
    toDate: '',
    purpose: '',
    remarks: '',

    districtCode: '',
    districtName: '',
    talukaCode: '',
    talukaName: '',
    villageCode: '',
    villageName: '',
    surveyNumber: '',
    subDivisionNumber: '',
    landType: '',
    areaInSqm: null,
    addressLine: '',
    pincode: '',
    siteGeo: null,

    declarationAccepted: false,
  };
}

/**
 * Narrows the draft into the shape the repository accepts.
 *
 * Returns null when a required value is still missing, which cannot happen
 * once every step has validated — but the create call takes non-nullable
 * values, and a silent `?? 0` would write a zero-depth excavation into a
 * statutory application.
 */
function toCreateInput(draft: ApplicationDraft, declarationAccepted: boolean) {
  if (
    !draft.idProofType ||
    !draft.excavationMethod ||
    !draft.landType ||
    draft.estimatedQuantity === null ||
    draft.areaInSqm === null ||
    !draft.siteGeo
  ) {
    return null;
  }

  const siteGeo: GeoPoint = draft.siteGeo;

  return {
    applicant: {
      fullName: draft.fullName.trim(),
      mobileNumber: draft.mobileNumber.trim(),
      ...(draft.email.trim() ? { email: draft.email.trim() } : {}),
      idProofType: draft.idProofType,
      idProofNumber: draft.idProofNumber.trim().toUpperCase(),
      ...(draft.alternatePhone.trim() ? { alternatePhone: draft.alternatePhone.trim() } : {}),
      registeredAddress: {
        line1: draft.registeredAddressLine.trim(),
        taluka: draft.registeredTaluka.trim(),
        district: draft.registeredDistrict.trim(),
        state: 'Maharashtra',
        pincode: draft.registeredPincode.trim(),
      },
    },
    mineralId: draft.mineralId,
    estimatedQuantity: { value: draft.estimatedQuantity, unit: 'MT' as const },
    excavationMethod: draft.excavationMethod,
    purpose: draft.purpose.trim(),
    ...(draft.remarks.trim() ? { remarks: draft.remarks.trim() } : {}),
    siteAddress: {
      line1: draft.addressLine.trim(),
      taluka: draft.talukaName,
      district: draft.districtName,
      state: 'Maharashtra',
      pincode: draft.pincode.trim(),
    },
    siteGeo,
    village: draft.villageName,
    surveyNumber: draft.surveyNumber.trim(),
    ...(draft.subDivisionNumber.trim()
      ? { subDivisionNumber: draft.subDivisionNumber.trim() }
      : {}),
    landType: draft.landType,
    areaInSqm: draft.areaInSqm,
    declarationAccepted,
  };
}
