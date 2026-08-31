import type { Mineral } from '@/domain';
import { Input, QuantityInput, Select, Textarea } from '@/design-system';
import { EXCAVATION_METHODS, type ApplicationDraft } from '@/rules';
import { useCopy } from '@/content';
import type { StepProps } from './ApplicantStep';

export interface ExcavationStepProps extends StepProps {
  minerals: Mineral[];
}

/**
 * STEP 2 · WHAT WILL BE EXTRACTED.
 *
 * Mineral, quantity, method, depth and the working period. Depth sits here
 * rather than with the site because it describes the excavation, not the land:
 * the same plot dug two metres and dug eight is two different applications.
 *
 * The period is on this step, as it is on the web form — it is part of what is
 * being applied for, not a separate question.
 */
export function ExcavationStep({ draft, errors, update, minerals }: ExcavationStepProps) {
  const t = useCopy();

  return (
    <div className="space-y-4">
      <Select
        label={t.excavation.mineral}
        required
        placeholder="Select a mineral"
        value={draft.mineralId}
        options={minerals.map((mineral) => ({ value: mineral.id, label: mineral.name }))}
        {...(errors.mineralId ? { error: errors.mineralId } : {})}
        onChange={(event) => update('mineralId', event.target.value)}
      />

      <QuantityInput
        label={t.excavation.estimatedQuantity}
        required
        value={draft.estimatedQuantity}
        unit="MT"
        onChange={(value) => update('estimatedQuantity', value)}
        {...(errors.estimatedQuantity ? { error: errors.estimatedQuantity } : {})}
      />

      <Select
        label={t.excavation.excavationMethod}
        required
        placeholder="Select a method"
        value={draft.excavationMethod}
        options={EXCAVATION_METHODS.map((method) => ({
          value: method,
          label: t.excavation.excavationMethods[method],
        }))}
        {...(errors.excavationMethod ? { error: errors.excavationMethod } : {})}
        onChange={(event) =>
          update('excavationMethod', event.target.value as ApplicationDraft['excavationMethod'])
        }
      />

      <Input
        label={`${t.excavation.depth} (m)`}
        required
        inputMode="decimal"
        value={draft.depthInMetres ?? ''}
        {...(errors.depthInMetres ? { error: errors.depthInMetres } : {})}
        onChange={(event) =>
          update('depthInMetres', event.target.value ? Number(event.target.value) : null)
        }
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t.excavation.from}
          required
          type="date"
          value={draft.fromDate}
          {...(errors.fromDate ? { error: errors.fromDate } : {})}
          onChange={(event) => update('fromDate', event.target.value)}
        />
        <Input
          label={t.excavation.to}
          required
          type="date"
          value={draft.toDate}
          {...(errors.toDate ? { error: errors.toDate } : {})}
          onChange={(event) => update('toDate', event.target.value)}
        />
      </div>

      <Textarea
        label={t.excavation.purpose}
        required
        placeholder="What the excavated mineral will be used for"
        value={draft.purpose}
        {...(errors.purpose ? { error: errors.purpose } : {})}
        onChange={(event) => update('purpose', event.target.value)}
      />

      <Textarea
        label={t.excavation.remarks}
        hint={t.excavation.remarksHint}
        value={draft.remarks}
        onChange={(event) => update('remarks', event.target.value)}
      />
    </div>
  );
}
