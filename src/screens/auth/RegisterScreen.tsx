import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User as UserIcon } from 'lucide-react';
import type { UserType } from '@/domain';
import {
  Button,
  ChoiceGroup,
  ChoiceRow,
  Input,
  Select,
  StepProgress,
} from '@/design-system';
import { ROUTES } from '@/navigation';
import {
  MOBILE_LENGTH,
  type ConsumerRegistrationDetails,
  type OrganizationRegistrationDetails,
  isValidMobile,
  isValidPincode,
  normalizeMobile,
  registrationStepCount,
} from '@/rules';
import { useAuthFlowStore } from '@/state';
import { useCopy } from '@/content';
import { AuthLayout } from './AuthLayout';

/**
 * REGISTRATION — where the user type, and therefore the entire experience,
 * is established.
 *
 * Three short steps rather than one long form:
 *
 *   1. User type      the most consequential choice, asked first
 *   2. Your details   name and mobile — the same for everyone
 *   3. Type-specific  organization details OR delivery location
 *
 * Step 1 comes first because it determines what step 3 needs to ask. Asking
 * every question to everyone would produce exactly the long, overwhelming form
 * the UX principles rule out — and would ask Normal Consumers for organization
 * details they must never be shown.
 *
 * PROVISIONAL (open questions #5, #8, #9): the real registration field list is
 * unconfirmed. These are the minimum needed for the account to function.
 */
export function RegisterScreen() {
  const navigate = useNavigate();
  const startRegistration = useAuthFlowStore((state) => state.startRegistration);
  const t = useCopy();

  const totalSteps = registrationStepCount();
  const [step, setStep] = useState(1);

  const [userType, setUserType] = useState<UserType | null>(null);
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [organization, setOrganization] = useState<OrganizationRegistrationDetails>({
    organizationName: '',
    organizationType: 'BUILDER',
    registrationNumber: '',
  });
  const [delivery, setDelivery] = useState<ConsumerRegistrationDetails>({
    addressLine: '',
    taluka: '',
    district: '',
    pincode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function back() {
    setErrors({});
    if (step === 1) navigate(ROUTES.welcome);
    else setStep((value) => value - 1);
  }

  function next() {
    const found = validateStep();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    if (step < totalSteps) {
      setStep((value) => value + 1);
      return;
    }

    if (!userType) return;

    startRegistration({
      userType,
      fullName,
      mobileNumber: normalizeMobile(mobile),
      ...(userType === 'ORGANIZATION' ? { organization } : { delivery }),
    });
    navigate(ROUTES.verify);
  }

  function validateStep(): Record<string, string> {
    const found: Record<string, string> = {};

    if (step === 2) {
      if (!fullName.trim()) found.fullName = t.auth.required;
      if (!isValidMobile(mobile)) found.mobile = t.auth.mobileInvalid;
    }

    if (step === 3 && userType === 'ORGANIZATION') {
      if (!organization.organizationName.trim()) found.organizationName = t.auth.required;
      if (!organization.registrationNumber.trim()) found.registrationNumber = t.auth.required;
    }

    if (step === 3 && userType === 'NORMAL_CONSUMER') {
      if (!delivery.addressLine.trim()) found.addressLine = t.auth.required;
      if (!delivery.taluka.trim()) found.taluka = t.auth.required;
      if (!delivery.district.trim()) found.district = t.auth.required;
      if (!isValidPincode(delivery.pincode)) found.pincode = t.auth.pincodeInvalid;
    }

    return found;
  }

  const canContinue = step === 1 ? userType !== null : true;

  return (
    <AuthLayout
      onBack={back}
      header={<StepProgress current={step} total={totalSteps} />}
      title={stepTitle()}
      description={stepDescription()}
      footer={
        <Button size="lg" fullWidth onClick={next} disabled={!canContinue}>
          {step === totalSteps ? t.auth.verifyTitle : t.actions.continue}
        </Button>
      }
    >
      <div className="mt-7 pb-4">
        {step === 1 && (
          <ChoiceGroup label={t.auth.userTypeQuestion}>
            <ChoiceRow
              title={t.userType.NORMAL_CONSUMER}
              description={t.auth.consumerSummary}
              leading={<UserIcon size={18} />}
              selected={userType === 'NORMAL_CONSUMER'}
              onSelect={() => setUserType('NORMAL_CONSUMER')}
            />
            <ChoiceRow
              title={t.userType.ORGANIZATION}
              description={t.auth.organizationSummary}
              leading={<Building2 size={18} />}
              selected={userType === 'ORGANIZATION'}
              onSelect={() => setUserType('ORGANIZATION')}
            />
          </ChoiceGroup>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Input
              label={t.auth.fullNameLabel}
              autoComplete="name"
              autoFocus
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
          </div>
        )}

        {step === 3 && userType === 'ORGANIZATION' && (
          <div className="space-y-4">
            <Input
              label={t.auth.organizationNameLabel}
              autoFocus
              value={organization.organizationName}
              {...(errors.organizationName ? { error: errors.organizationName } : {})}
              onChange={(event) =>
                setOrganization((prev) => ({ ...prev, organizationName: event.target.value }))
              }
            />
            <Select
              label={t.auth.organizationTypeLabel}
              /* Metadata only. Every option leads to the identical experience. */
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
            <Input
              label={t.auth.registrationNumberLabel}
              placeholder="MH/MK/ENT/2026/000000"
              value={organization.registrationNumber}
              {...(errors.registrationNumber ? { error: errors.registrationNumber } : {})}
              onChange={(event) =>
                setOrganization((prev) => ({ ...prev, registrationNumber: event.target.value }))
              }
            />
          </div>
        )}

        {step === 3 && userType === 'NORMAL_CONSUMER' && (
          <div className="space-y-4">
            <Input
              label={t.auth.addressLabel}
              autoFocus
              value={delivery.addressLine}
              {...(errors.addressLine ? { error: errors.addressLine } : {})}
              onChange={(event) =>
                setDelivery((prev) => ({ ...prev, addressLine: event.target.value }))
              }
            />
            <div className="flex gap-3">
              <Input
                label={t.auth.talukaLabel}
                value={delivery.taluka}
                {...(errors.taluka ? { error: errors.taluka } : {})}
                onChange={(event) =>
                  setDelivery((prev) => ({ ...prev, taluka: event.target.value }))
                }
              />
              <Input
                label={t.auth.districtLabel}
                value={delivery.district}
                {...(errors.district ? { error: errors.district } : {})}
                onChange={(event) =>
                  setDelivery((prev) => ({ ...prev, district: event.target.value }))
                }
              />
            </div>
            <Input
              label={t.auth.pincodeLabel}
              inputMode="numeric"
              maxLength={6}
              value={delivery.pincode}
              {...(errors.pincode ? { error: errors.pincode } : {})}
              onChange={(event) =>
                setDelivery((prev) => ({
                  ...prev,
                  pincode: event.target.value.replace(/\D/g, '').slice(0, 6),
                }))
              }
            />
          </div>
        )}
      </div>
    </AuthLayout>
  );

  function stepTitle(): string {
    if (step === 1) return t.auth.userTypeQuestion;
    if (step === 2) return t.auth.detailsTitle;
    return userType === 'ORGANIZATION' ? t.auth.organizationTitle : t.auth.deliveryTitle;
  }

  function stepDescription(): string | undefined {
    if (step === 1) return t.auth.userTypeHelp;
    if (step === 3 && userType === 'NORMAL_CONSUMER') return t.auth.deliveryHelp;
    return undefined;
  }
}
