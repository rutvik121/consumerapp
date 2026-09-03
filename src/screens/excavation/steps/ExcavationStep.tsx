import type { Mineral } from '@/domain';
import { Input, Select, Textarea, cn } from '@/design-system';
import {
  PROPOSAL_APPLICATION_TYPES,
  PROPOSAL_LEVELS,
  type ApplicationDraft,
} from '@/rules';
import type { StepProps } from './ApplicantStep';

export interface ExcavationStepProps extends StepProps {
  minerals: Mineral[];
}

/**
 * STEP 2 · APPLICATION & PROPOSAL DETAILS (Desktop Field Parity)
 *
 * Implements:
 * - Application Type (2 radio options)
 * - Lease Type (Temporary)
 * - Proposal Level
 * - Mineral
 * - Excavation Quantity in Brass (with MT conversion helper)
 * - Lifting Period (Days)
 * - Reason For Applying
 */
export function ExcavationStep({ draft, errors, update, minerals }: ExcavationStepProps) {
  return (
    <div className="space-y-4">
      {/* 1. Application Type */}
      <div>
        <label className="mb-2 block text-caption font-semibold text-ink">
          Application Type <span className="text-danger-500">*</span>
        </label>
        <div className="space-y-2">
          {PROPOSAL_APPLICATION_TYPES.map((type) => {
            const isSelected = draft.applicationType === type.value;
            return (
              <div
                key={type.value}
                onClick={() => update('applicationType', type.value)}
                className={cn(
                  'cursor-pointer rounded-xl border p-3.5 transition-all',
                  isSelected
                    ? 'border-primary-500 bg-primary-50/50 shadow-xs ring-1 ring-primary-400/40'
                    : 'border-line bg-surface hover:border-neutral-300',
                )}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="applicationType"
                    checked={isSelected}
                    onChange={() => update('applicationType', type.value)}
                    className="mt-0.5 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <p className="text-body-sm font-semibold text-ink">{type.label}</p>
                    <p className="mt-0.5 text-caption text-ink-muted">{type.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {errors.applicationType && (
          <p className="mt-1.5 text-caption text-danger-500">{errors.applicationType}</p>
        )}
      </div>

      {/* 2. Lease Type & Proposal Level */}
      <div className="grid grid-cols-2 gap-3 items-end">
        <div>
          <label className="mb-1.5 block text-caption font-semibold text-ink">
            Lease Type <span className="text-danger-500">*</span>
          </label>
          <div className="flex h-11 items-center rounded-lg border border-line bg-neutral-100/80 px-3.5 text-body-sm font-medium text-ink">
            Temporary
          </div>
        </div>

        <Select
          label="Proposal Level"
          required
          placeholder="Select level"
          value={draft.proposalLevel}
          options={PROPOSAL_LEVELS.map((level) => ({
            value: level.value,
            label: level.label,
          }))}
          {...(errors.proposalLevel ? { error: errors.proposalLevel } : {})}
          onChange={(event) =>
            update('proposalLevel', event.target.value as ApplicationDraft['proposalLevel'])
          }
        />
      </div>

      {/* 3. Mineral */}
      <Select
        label="Mineral"
        required
        placeholder="Select a mineral"
        value={draft.mineralId}
        options={minerals.map((mineral) => ({ value: mineral.id, label: mineral.name }))}
        {...(errors.mineralId ? { error: errors.mineralId } : {})}
        onChange={(event) => update('mineralId', event.target.value)}
      />

      {/* 4. Quantity in Brass & Lifting Days */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Input
            label="Excavation Quantity"
            required
            inputMode="numeric"
            value={draft.excavationQuantityBrass !== null ? String(draft.excavationQuantityBrass) : ''}
            placeholder="e.g. 100"
            rightSlot={<span className="text-caption font-medium text-ink-muted">Brass</span>}
            {...(errors.excavationQuantityBrass ? { error: errors.excavationQuantityBrass } : {})}
            onChange={(event) => {
              const val = event.target.value ? Number(event.target.value) : null;
              update('excavationQuantityBrass', val);
              if (val) update('estimatedQuantity', val);
            }}
          />
        </div>

        <Input
          label="Lifting Period (Days)"
          required
          inputMode="numeric"
          value={draft.liftingPeriodDays !== null ? String(draft.liftingPeriodDays) : ''}
          placeholder="e.g. 60"
          rightSlot={<span className="text-caption font-medium text-ink-muted">Days</span>}
          {...(errors.liftingPeriodDays ? { error: errors.liftingPeriodDays } : {})}
          onChange={(event) =>
            update('liftingPeriodDays', event.target.value ? Number(event.target.value) : null)
          }
        />
      </div>

      {/* 5. Reason For Applying */}
      <Textarea
        label="Reason For Applying"
        required
        placeholder="Provide the purpose and justification for excavation..."
        rows={3}
        value={draft.reasonForApplying}
        {...(errors.reasonForApplying ? { error: errors.reasonForApplying } : {})}
        onChange={(event) => update('reasonForApplying', event.target.value)}
      />
    </div>
  );
}
