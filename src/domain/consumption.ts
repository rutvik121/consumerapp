import type { ID, ISODateTime, Quantity } from './common';
import type { InventoryScope } from './inventory';

/**
 * A recorded draw-down against an inventory balance.
 *
 *     Available Quantity → Enter Consumption → Remaining Quantity
 *
 * VALIDATION (open question #6 / assumption #4): the Project Context says to
 * keep this flexible rather than invent rules. The single policy decision
 * lives in `canRecordConsumption()` in @/rules/inventoryRules — change it
 * there, not in screens.
 */
export interface ConsumptionEntry {
  id: ID;
  inventoryBalanceId: ID;
  scope: InventoryScope;
  mineralId: ID;
  quantity: Quantity;
  recordedAt: ISODateTime;
  recordedByUserId: ID;
  purpose?: string;
  remarks?: string;
}
