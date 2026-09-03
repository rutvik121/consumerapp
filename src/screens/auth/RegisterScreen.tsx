import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ShieldCheck, User as UserIcon } from 'lucide-react';
import type { UserType } from '@/domain';
import {
  Button,
  DocumentUpload,
  Input,
  Select,
  StepProgress,
  type UploadedFile,
} from '@/design-system';
import { ROUTES } from '@/navigation';
import {
  MOBILE_LENGTH,
  type AddressRegistrationDetails,
  type OrganizationRegistrationDetails,
  formatAadhaar,
  isValidAadhaar,
  isValidMobile,
  isValidPan,
  isValidPincode,
  normalizeAadhaar,
  normalizeMobile,
  normalizePan,
  registrationStepCount,
} from '@/rules';
import { useAuthFlowStore } from '@/state';
import { useCopy } from '@/content';
import { AuthLayout } from './AuthLayout';

/**
 * REGISTRATION — Streamlined 2-Step KYC Flow:
 *
 * 1. Step 1 (Basic & Address details):
 *    - Individual: Full name, mobile number, and address
 *    - Organization: Authorized representative name, mobile number, org name, type, and address
 * 2. Step 2 (KYC Verification):
 *    - Individual: Aadhaar card number + Aadhaar document upload (OTP dispatched to Aadhaar-linked mobile)
 *    - Organization: PAN card number + PAN document upload (OTP dispatched to PAN-linked mobile)
 * 3. Step 3 (OTP Verification on /verify):
 *    - Entering the OTP verifies KYC, creates the account, and automatically signs the user in.
 */
export function RegisterScreen() {
  const navigate = useNavigate();
  const startRegistration = useAuthFlowStore((state) => state.startRegistration);
  const t = useCopy();

  const totalSteps = registrationStepCount(); // 2 steps in form + OTP screen
  const [step, setStep] = useState(1);

  // Account Type: Individual (NORMAL_CONSUMER) by default, or ORGANIZATION
  const [userType, setUserType] = useState<UserType>('NORMAL_CONSUMER');

  // Step 1: Personal / Representative & Contact Details
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');

  // Step 1: Address Details (Unified for both Individual & Organization)
  const [address, setAddress] = useState<AddressRegistrationDetails>({
    addressLine: '',
    taluka: '',
    district: '',
    pincode: '',
  });

  // Step 1: Organization Specific Details
  const [organization, setOrganization] = useState<OrganizationRegistrationDetails>({
    organizationName: '',
    organizationType: 'BUILDER',
    registrationNumber: '',
  });

  // Step 2: KYC Details
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [kycFile, setKycFile] = useState<UploadedFile | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleUserTypeChange(type: UserType) {
    if (type === userType) return;
    setUserType(type);
    setErrors({});
    // Reset KYC if type switches
    setKycFile(null);
  }

  function back() {
    setErrors({});
    if (step === 1) {
      navigate(ROUTES.welcome);
    } else {
      setStep((value) => value - 1);
    }
  }

  function next() {
    const found = validateStep();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    if (step < totalSteps) {
      setStep((value) => value + 1);
      return;
    }

    // Step 2 completed: initiate registration and proceed to OTP verification
    const normalizedMobile = normalizeMobile(mobile);
    const isIndividual = userType === 'NORMAL_CONSUMER';

    startRegistration({
      userType,
      fullName: fullName.trim(),
      mobileNumber: normalizedMobile,
      address: {
        addressLine: address.addressLine.trim(),
        taluka: address.taluka.trim(),
        district: address.district.trim(),
        pincode: address.pincode.trim(),
      },
      delivery: {
        addressLine: address.addressLine.trim(),
        taluka: address.taluka.trim(),
        district: address.district.trim(),
        pincode: address.pincode.trim(),
      },
      organization:
        userType === 'ORGANIZATION'
          ? {
              organizationName: organization.organizationName.trim(),
              organizationType: organization.organizationType,
              registrationNumber: organization.registrationNumber?.trim() || normalizePan(panNumber),
            }
          : undefined,
      kyc: {
        documentKind: isIndividual ? 'AADHAAR' : 'PAN',
        documentNumber: isIndividual ? normalizeAadhaar(aadhaarNumber) : normalizePan(panNumber),
        fileName: kycFile?.name || (isIndividual ? 'aadhaar_card.pdf' : 'pan_card.pdf'),
        fileSize: kycFile?.size,
        fileUrl: kycFile?.url,
      },
    });

    navigate(ROUTES.verify);
  }

  function validateStep(): Record<string, string> {
    const found: Record<string, string> = {};

    if (step === 1) {
      if (!fullName.trim()) found.fullName = t.auth.required;
      if (!isValidMobile(mobile)) found.mobile = t.auth.mobileInvalid;

      if (!address.addressLine.trim()) found.addressLine = t.auth.required;
      if (!address.taluka.trim()) found.taluka = t.auth.required;
      if (!address.district.trim()) found.district = t.auth.required;
      if (!isValidPincode(address.pincode)) found.pincode = t.auth.pincodeInvalid;

      if (userType === 'ORGANIZATION') {
        if (!organization.organizationName.trim()) found.organizationName = t.auth.required;
      }
    }

    if (step === 2) {
      if (userType === 'NORMAL_CONSUMER') {
        if (!isValidAadhaar(aadhaarNumber)) {
          found.aadhaarNumber = t.auth.aadhaarInvalid;
        }
        if (!kycFile) {
          found.kycFile = t.auth.kycDocRequired;
        }
      } else {
        if (!isValidPan(panNumber)) {
          found.panNumber = t.auth.panInvalid;
        }
        if (!kycFile) {
          found.kycFile = t.auth.kycDocRequired;
        }
      }
    }

    return found;
  }

  const isIndividual = userType === 'NORMAL_CONSUMER';

  return (
    <AuthLayout
      onBack={back}
      header={<StepProgress current={step} total={totalSteps} />}
      title={step === 1 ? t.auth.stepDetailsTitle : t.auth.stepKycTitle}
      description={
        step === 1
          ? isIndividual
            ? t.auth.stepDetailsHelpIndividual
            : t.auth.stepDetailsHelpOrganization
          : isIndividual
            ? t.auth.kycDescIndividual
            : t.auth.kycDescOrganization
      }
      footer={
        <Button size="lg" fullWidth onClick={next}>
          {step === 1 ? t.auth.continueToKyc : t.auth.verifyAndSendOtp}
        </Button>
      }
    >
      <div className="mt-5 pb-4">
        {step === 1 && (
          <div className="space-y-4">
            {/* Account Type Toggle */}
            <div className="grid grid-cols-2 rounded-xl bg-neutral-200/70 p-1">
              <button
                type="button"
                onClick={() => handleUserTypeChange('NORMAL_CONSUMER')}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-body-sm font-medium transition-all ${
                  isIndividual
                    ? 'bg-surface text-ink shadow-xs font-semibold'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                <UserIcon size={16} />
                <span>{t.auth.individualTab}</span>
              </button>
              <button
                type="button"
                onClick={() => handleUserTypeChange('ORGANIZATION')}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-body-sm font-medium transition-all ${
                  !isIndividual
                    ? 'bg-surface text-ink shadow-xs font-semibold'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                <Building2 size={16} />
                <span>{t.auth.organizationTab}</span>
              </button>
            </div>

            {/* Basic Details */}
            <Input
              label={isIndividual ? t.auth.fullNameLabel : t.auth.repFullNameLabel}
              autoComplete="name"
              autoFocus
              placeholder="e.g. Ramesh Patil"
              value={fullName}
              {...(errors.fullName ? { error: errors.fullName } : {})}
              onChange={(event) => setFullName(event.target.value)}
            />

            <Input
              label={t.auth.mobileLabel}
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={MOBILE_LENGTH}
              placeholder={t.auth.mobilePlaceholder}
              value={mobile}
              leftIcon={<span className="text-body text-ink-secondary tabular">+91</span>}
              hint={t.auth.mobileHint}
              {...(errors.mobile ? { error: errors.mobile } : {})}
              onChange={(event) =>
                setMobile(event.target.value.replace(/\D/g, '').slice(0, MOBILE_LENGTH))
              }
            />

            {/* Organization specifics */}
            {!isIndividual && (
              <>
                <Input
                  label={t.auth.organizationNameLabel}
                  placeholder="e.g. Sahyadri Builders Pvt Ltd"
                  value={organization.organizationName}
                  {...(errors.organizationName ? { error: errors.organizationName } : {})}
                  onChange={(event) =>
                    setOrganization((prev) => ({ ...prev, organizationName: event.target.value }))
                  }
                />

                <Select
                  label={t.auth.organizationTypeLabel}
                  hint={t.auth.organizationTypeHint}
                  value={organization.organizationType}
                  options={[
                    { value: 'BUILDER', label: t.organizationType.BUILDER },
                    { value: 'CONTRACTOR', label: t.organizationType.CONTRACTOR },
                    { value: 'GOVERNMENT', label: t.organizationType.GOVERNMENT },
                    { value: 'OTHER', label: t.organizationType.OTHER },
                  ]}
                  onChange={(event) =>
                    setOrganization((prev) => ({
                      ...prev,
                      organizationType: event.target
                        .value as OrganizationRegistrationDetails['organizationType'],
                    }))
                  }
                />
              </>
            )}

            {/* Address Details */}
            <div className="pt-2">
              <p className="mb-2 text-caption font-semibold tracking-wide text-ink-muted uppercase">
                {isIndividual ? t.auth.deliveryTitle : t.auth.orgAddressLabel}
              </p>

              <div className="space-y-4">
                <Input
                  label={t.auth.addressLabel}
                  placeholder="Plot / House No., Building, Area / Road"
                  value={address.addressLine}
                  {...(errors.addressLine ? { error: errors.addressLine } : {})}
                  onChange={(event) =>
                    setAddress((prev) => ({ ...prev, addressLine: event.target.value }))
                  }
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={t.auth.talukaLabel}
                    placeholder="Taluka"
                    value={address.taluka}
                    {...(errors.taluka ? { error: errors.taluka } : {})}
                    onChange={(event) =>
                      setAddress((prev) => ({ ...prev, taluka: event.target.value }))
                    }
                  />
                  <Input
                    label={t.auth.districtLabel}
                    placeholder="District"
                    value={address.district}
                    {...(errors.district ? { error: errors.district } : {})}
                    onChange={(event) =>
                      setAddress((prev) => ({ ...prev, district: event.target.value }))
                    }
                  />
                </div>

                <Input
                  label={t.auth.pincodeLabel}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit PIN code"
                  value={address.pincode}
                  {...(errors.pincode ? { error: errors.pincode } : {})}
                  onChange={(event) =>
                    setAddress((prev) => ({
                      ...prev,
                      pincode: event.target.value.replace(/\D/g, '').slice(0, 6),
                    }))
                  }
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            {isIndividual ? (
              <>
                {/* Individual: Aadhaar KYC */}
                <Input
                  label={t.auth.aadhaarLabel}
                  inputMode="numeric"
                  autoFocus
                  placeholder={t.auth.aadhaarPlaceholder}
                  maxLength={14}
                  value={formatAadhaar(aadhaarNumber)}
                  {...(errors.aadhaarNumber ? { error: errors.aadhaarNumber } : {})}
                  onChange={(event) => {
                    const raw = event.target.value.replace(/\D/g, '').slice(0, 12);
                    setAadhaarNumber(raw);
                  }}
                />

                <DocumentUpload
                  label={t.auth.uploadAadhaarLabel}
                  description={t.auth.uploadAadhaarHint}
                  file={kycFile}
                  onFileSelect={setKycFile}
                  onRemove={() => setKycFile(null)}
                  error={errors.kycFile}
                  required
                  sampleFileName="aadhaar_card_front.pdf"
                />

                {/* Aadhaar Notice Banner */}
                <div className="flex items-start gap-3 rounded-xl border border-primary-200 bg-primary-50/60 p-3.5 text-primary-950">
                  <ShieldCheck size={20} className="mt-0.5 shrink-0 text-primary-700" />
                  <p className="text-body-sm leading-relaxed text-ink">
                    {t.auth.kycNoticeIndividual}
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Organization: PAN KYC */}
                <Input
                  label={t.auth.panLabel}
                  autoFocus
                  placeholder={t.auth.panPlaceholder}
                  maxLength={10}
                  value={panNumber}
                  {...(errors.panNumber ? { error: errors.panNumber } : {})}
                  onChange={(event) => {
                    const raw = normalizePan(event.target.value).slice(0, 10);
                    setPanNumber(raw);
                  }}
                />

                <DocumentUpload
                  label={t.auth.uploadPanLabel}
                  description={t.auth.uploadPanHint}
                  file={kycFile}
                  onFileSelect={setKycFile}
                  onRemove={() => setKycFile(null)}
                  error={errors.kycFile}
                  required
                  sampleFileName="company_pan_card.pdf"
                />

                {/* PAN Notice Banner */}
                <div className="flex items-start gap-3 rounded-xl border border-primary-200 bg-primary-50/60 p-3.5 text-primary-950">
                  <ShieldCheck size={20} className="mt-0.5 shrink-0 text-primary-700" />
                  <p className="text-body-sm leading-relaxed text-ink">
                    {t.auth.kycNoticeOrganization}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
