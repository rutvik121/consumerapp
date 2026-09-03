import { Input } from '@/design-system';
import type { ApplicationDraft } from '@/rules';

export interface StepProps {
  draft: ApplicationDraft;
  errors: Record<string, string>;
  update: <K extends keyof ApplicationDraft>(key: K, value: ApplicationDraft[K]) => void;
}

/**
 * STEP 1 · APPLICANT DETAILS & IDENTITY (Desktop Field Parity)
 *
 * Captures all desktop fields:
 * - Applicant Name, Mobile, Landline, Email
 * - Registered Address, District, Taluka, Pincode
 * - PAN Number, Aadhaar Number, GST Number
 */
export function ApplicantStep({ draft, errors, update }: StepProps) {
  return (
    <div className="space-y-4">
      <Input
        label="Applicant Name"
        required
        value={draft.fullName}
        {...(errors.fullName ? { error: errors.fullName } : {})}
        onChange={(event) => update('fullName', event.target.value)}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Applicant Mobile No."
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
          label="Applicant Landline No."
          inputMode="tel"
          placeholder="e.g. 020-2567890"
          value={draft.landlineNumber}
          {...(errors.landlineNumber ? { error: errors.landlineNumber } : {})}
          onChange={(event) => update('landlineNumber', event.target.value)}
        />
      </div>

      <Input
        label="Applicant Email Id"
        type="email"
        required
        value={draft.email}
        {...(errors.email ? { error: errors.email } : {})}
        onChange={(event) => update('email', event.target.value)}
      />

      <Input
        label="Applicant Address"
        required
        value={draft.registeredAddressLine}
        {...(errors.registeredAddressLine ? { error: errors.registeredAddressLine } : {})}
        onChange={(event) => update('registeredAddressLine', event.target.value)}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="District"
          required
          value={draft.registeredDistrict}
          {...(errors.registeredDistrict ? { error: errors.registeredDistrict } : {})}
          onChange={(event) => update('registeredDistrict', event.target.value)}
        />
        <Input
          label="Applicant Pincode"
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

      <div className="rounded-xl border border-line bg-surface-raised p-3.5 space-y-3 mt-2">
        <h3 className="text-caption font-bold uppercase tracking-wider text-ink-secondary">
          Tax & Identification Numbers
        </h3>

        <Input
          label="PAN Number"
          required
          autoCapitalize="characters"
          maxLength={10}
          placeholder="ABCDE1234F"
          value={draft.panNumber}
          {...(errors.panNumber ? { error: errors.panNumber } : {})}
          onChange={(event) => update('panNumber', event.target.value.toUpperCase())}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Aadhaar Number"
            inputMode="numeric"
            maxLength={14}
            placeholder="XXXX XXXX XXXX"
            value={draft.aadhaarNumber}
            {...(errors.aadhaarNumber ? { error: errors.aadhaarNumber } : {})}
            onChange={(event) => {
              const digits = event.target.value.replace(/\D/g, '').slice(0, 12);
              const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
              update('aadhaarNumber', formatted);
            }}
          />

          <Input
            label="GST Number"
            autoCapitalize="characters"
            maxLength={15}
            placeholder="27AAAAA0000A1Z5"
            value={draft.gstNumber}
            {...(errors.gstNumber ? { error: errors.gstNumber } : {})}
            onChange={(event) => update('gstNumber', event.target.value.toUpperCase())}
          />
        </div>
      </div>
    </div>
  );
}
