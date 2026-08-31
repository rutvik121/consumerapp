import { Input, Select } from '@/design-system';
import { ID_PROOF_TYPES, type ApplicationDraft } from '@/rules';
import { useCopy } from '@/content';

export interface StepProps {
  draft: ApplicationDraft;
  errors: Record<string, string>;
  update: <K extends keyof ApplicationDraft>(key: K, value: ApplicationDraft[K]) => void;
}

/**
 * STEP 1 · WHO IS APPLYING.
 *
 * Every field here opens pre-filled from the signed-in account and the
 * organization's registered address. They are shown rather than hidden because
 * the order is issued against them and a stale mobile number is the applicant's
 * problem to catch, not the department's — but nothing on this step is a
 * question the app did not already have an answer to.
 */
export function ApplicantStep({ draft, errors, update }: StepProps) {
  const t = useCopy();

  return (
    <div className="space-y-4">
      <Input
        label={t.excavation.applicantName}
        required
        value={draft.fullName}
        {...(errors.fullName ? { error: errors.fullName } : {})}
        onChange={(event) => update('fullName', event.target.value)}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t.excavation.applicantMobile}
          required
          inputMode="numeric"
          maxLength={10}
          value={draft.mobileNumber}
          {...(errors.mobileNumber ? { error: errors.mobileNumber } : {})}
          onChange={(event) =>
            update('mobileNumber', event.target.value.replace(/\D/g, '').slice(0, 10))
          }
        />
        <Input
          label={t.excavation.alternatePhone}
          inputMode="tel"
          value={draft.alternatePhone}
          {...(errors.alternatePhone ? { error: errors.alternatePhone } : {})}
          onChange={(event) => update('alternatePhone', event.target.value)}
        />
      </div>

      <Input
        label={t.excavation.applicantEmail}
        type="email"
        hint={t.excavation.applicantEmailHint}
        value={draft.email}
        {...(errors.email ? { error: errors.email } : {})}
        onChange={(event) => update('email', event.target.value)}
      />

      <Select
        label={t.excavation.idProof}
        required
        placeholder="Select an ID proof"
        value={draft.idProofType}
        options={ID_PROOF_TYPES.map((type) => ({
          value: type,
          label: t.excavation.idProofTypes[type],
        }))}
        {...(errors.idProofType ? { error: errors.idProofType } : {})}
        onChange={(event) =>
          update('idProofType', event.target.value as ApplicationDraft['idProofType'])
        }
      />

      <Input
        label={t.excavation.idProofNumber}
        required
        autoCapitalize="characters"
        value={draft.idProofNumber}
        {...(errors.idProofNumber ? { error: errors.idProofNumber } : {})}
        onChange={(event) => update('idProofNumber', event.target.value.toUpperCase())}
      />

      <Input
        label={t.excavation.registeredAddress}
        required
        value={draft.registeredAddressLine}
        {...(errors.registeredAddressLine ? { error: errors.registeredAddressLine } : {})}
        onChange={(event) => update('registeredAddressLine', event.target.value)}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t.excavation.taluka}
          required
          value={draft.registeredTaluka}
          {...(errors.registeredTaluka ? { error: errors.registeredTaluka } : {})}
          onChange={(event) => update('registeredTaluka', event.target.value)}
        />
        <Input
          label={t.excavation.district}
          required
          value={draft.registeredDistrict}
          {...(errors.registeredDistrict ? { error: errors.registeredDistrict } : {})}
          onChange={(event) => update('registeredDistrict', event.target.value)}
        />
      </div>

      <Input
        label={t.excavation.pincode}
        required
        inputMode="numeric"
        maxLength={6}
        value={draft.registeredPincode}
        {...(errors.registeredPincode ? { error: errors.registeredPincode } : {})}
        onChange={(event) =>
          update('registeredPincode', event.target.value.replace(/\D/g, '').slice(0, 6))
        }
      />
    </div>
  );
}
