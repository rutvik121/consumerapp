import { CheckCircle2, Upload } from 'lucide-react';
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
 * - Conditional Project Details for 'Quarry For Project - Self Consumption'
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
        <div className="grid grid-cols-2 gap-2.5">
          {PROPOSAL_APPLICATION_TYPES.map((type) => {
            const isSelected = draft.applicationType === type.value;
            return (
              <div
                key={type.value}
                onClick={() => update('applicationType', type.value)}
                className={cn(
                  'cursor-pointer rounded-xl border p-3 transition-all flex flex-col justify-start',
                  isSelected
                    ? 'border-primary-500 bg-primary-50/50 shadow-xs ring-1 ring-primary-400/40'
                    : 'border-line bg-surface hover:border-neutral-300',
                )}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="applicationType"
                    checked={isSelected}
                    onChange={() => update('applicationType', type.value)}
                    className="mt-0.5 shrink-0 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <p className="text-body-sm font-semibold leading-snug text-ink">{type.label}</p>
                    <p className="mt-1 text-[11.5px] leading-snug text-ink-muted">{type.description}</p>
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

      {/* 2. Conditional Project Details (When 'Quarry For Project - Self Consumption' is selected) */}
      {draft.applicationType === 'QUARRY_PROJECT_SELF_CONSUMPTION' && (
        <div className="rounded-2xl border border-[#fce8b2] bg-[#fdfaf3] p-4 shadow-xs space-y-4 animate-fadeIn">
          {/* Section Header */}
          <div className="flex items-center justify-between border-b border-[#fce8b2]/80 pb-2.5">
            <h3 className="text-body font-bold text-[#8c4b12]">Project Details</h3>
            <span className="rounded-full bg-[#fef9e7] px-2.5 py-0.5 text-[11px] font-semibold text-[#b45309] border border-[#fce8b2]">
              Self Consumption
            </span>
          </div>

          {/* Project Type: Government / Private */}
          <div>
            <label className="mb-1.5 block text-caption font-semibold text-ink">
              Project Type:
            </label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-body-sm font-medium text-ink cursor-pointer">
                <input
                  type="radio"
                  name="projectType"
                  value="GOVERNMENT"
                  checked={draft.projectType === 'GOVERNMENT' || !draft.projectType}
                  onChange={() => update('projectType', 'GOVERNMENT')}
                  className="text-primary-600 focus:ring-primary-500"
                />
                Government
              </label>
              <label className="flex items-center gap-2 text-body-sm font-medium text-ink cursor-pointer">
                <input
                  type="radio"
                  name="projectType"
                  value="PRIVATE"
                  checked={draft.projectType === 'PRIVATE'}
                  onChange={() => update('projectType', 'PRIVATE')}
                  className="text-primary-600 focus:ring-primary-500"
                />
                Private
              </label>
            </div>
          </div>

          {/* Department & Office (Government Projects Only) */}
          {draft.projectType !== 'PRIVATE' && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Department: *"
                placeholder="Department Name"
                required
                value={draft.departmentName || ''}
                {...(errors.departmentName ? { error: errors.departmentName } : {})}
                onChange={(e) => update('departmentName', e.target.value)}
              />
              <Input
                label="Office: *"
                placeholder="Office Name"
                required
                value={draft.officeName || ''}
                {...(errors.officeName ? { error: errors.officeName } : {})}
                onChange={(e) => update('officeName', e.target.value)}
              />
            </div>
          )}

          {/* WORK ORDER NUMBER Banner & Upload Document (Government Projects Only) */}
          {draft.projectType !== 'PRIVATE' && (
            <div className="rounded-xl border border-[#e5d2ac] bg-[#f8edd6]/60 p-3 space-y-2.5">
              <label className="block text-[11px] font-bold tracking-wider uppercase text-[#78350f]">
                WORK ORDER NUMBER
              </label>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="WorkOrder Number"
                    value={draft.workOrderNumber || ''}
                    onChange={(e) => update('workOrderNumber', e.target.value)}
                  />
                </div>
                <div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          update('workOrderDocumentName', file.name);
                        }
                      }}
                    />
                    <span className="flex h-11 items-center justify-center gap-1.5 rounded-lg bg-[#5c2d11] px-3.5 text-caption font-semibold text-white hover:bg-[#431f0a] active:scale-95 transition-all shadow-xs cursor-pointer select-none">
                      <Upload size={14} />
                      Upload Document
                    </span>
                  </label>
                </div>
              </div>

              {draft.workOrderDocumentName && (
                <div className="flex items-center justify-between rounded-lg bg-white/90 px-2.5 py-1.5 text-caption font-medium text-ink border border-[#e5d2ac]">
                  <span className="flex items-center gap-1.5 text-success-700 truncate">
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span className="truncate">{draft.workOrderDocumentName}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => update('workOrderDocumentName', '')}
                    className="text-danger-500 hover:text-danger-700 text-[11px] font-bold shrink-0 ml-2"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Project Code & Project Name */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Project Code: *"
              placeholder="Project Code"
              required
              value={draft.projectCode || ''}
              {...(errors.projectCode ? { error: errors.projectCode } : {})}
              onChange={(e) => update('projectCode', e.target.value)}
            />
            <Input
              label="Project Name: *"
              placeholder="Project Name"
              required
              value={draft.projectName || ''}
              {...(errors.projectName ? { error: errors.projectName } : {})}
              onChange={(e) => update('projectName', e.target.value)}
            />
          </div>

          {/* Address */}
          <Input
            label="Address: *"
            placeholder="Address"
            required
            value={draft.projectAddress || ''}
            {...(errors.projectAddress ? { error: errors.projectAddress } : {})}
            onChange={(e) => update('projectAddress', e.target.value)}
          />

          {/* Project Location (Latitude) & (Longitude) */}
          <div className="grid grid-cols-2 gap-3 items-end">
            <Input
              label="Project Location (Latitude): *"
              placeholder="99.9999"
              required
              value={draft.projectLatitude || ''}
              {...(errors.projectLatitude ? { error: errors.projectLatitude } : {})}
              onChange={(e) => update('projectLatitude', e.target.value)}
            />
            <Input
              label="Project Location (Longitude): *"
              placeholder="99.9999"
              required
              value={draft.projectLongitude || ''}
              {...(errors.projectLongitude ? { error: errors.projectLongitude } : {})}
              onChange={(e) => update('projectLongitude', e.target.value)}
              rightSlot={
                <span className="text-sm select-none" title="Map Coordinate">
                  📍
                </span>
              }
            />
          </div>

          {/* Zero Royalty Scheme: No / Yes */}
          <div>
            <label className="mb-1.5 block text-caption font-semibold text-ink">
              Zero Royalty Scheme
            </label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-body-sm font-medium text-ink cursor-pointer">
                <input
                  type="radio"
                  name="zeroRoyaltyScheme"
                  value="NO"
                  checked={draft.zeroRoyaltyScheme === 'NO' || !draft.zeroRoyaltyScheme}
                  onChange={() => update('zeroRoyaltyScheme', 'NO')}
                  className="text-primary-600 focus:ring-primary-500"
                />
                No
              </label>
              <label className="flex items-center gap-2 text-body-sm font-medium text-ink cursor-pointer">
                <input
                  type="radio"
                  name="zeroRoyaltyScheme"
                  value="YES"
                  checked={draft.zeroRoyaltyScheme === 'YES'}
                  onChange={() => update('zeroRoyaltyScheme', 'YES')}
                  className="text-primary-600 focus:ring-primary-500"
                />
                Yes
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 3. Lease Type & Proposal Level */}
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

      {/* 4. Mineral */}
      <Select
        label="Mineral"
        required
        placeholder="Select a mineral"
        value={draft.mineralId}
        options={minerals.map((mineral) => ({ value: mineral.id, label: mineral.name }))}
        {...(errors.mineralId ? { error: errors.mineralId } : {})}
        onChange={(event) => update('mineralId', event.target.value)}
      />

      {/* 5. Quantity in Brass & Lifting Days */}
      {draft.applicationType === 'QUARRY_PROJECT_SELF_CONSUMPTION' ? (
        <div className="space-y-3">
          {/* Total Excavation Quantity & Excavation Quantity side-by-side */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Total Excavation Quantity"
              required
              inputMode="numeric"
              value={draft.totalExcavationQuantityBrass !== null ? String(draft.totalExcavationQuantityBrass) : ''}
              placeholder="e.g. 500"
              rightSlot={<span className="text-caption font-medium text-ink-muted">Brass</span>}
              {...(errors.totalExcavationQuantityBrass ? { error: errors.totalExcavationQuantityBrass } : {})}
              onChange={(event) => {
                const val = event.target.value ? Number(event.target.value) : null;
                update('totalExcavationQuantityBrass', val);
              }}
            />

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

          <div className="grid grid-cols-2 gap-3">
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
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
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
      )}

      {/* 6. Reason For Applying */}
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
