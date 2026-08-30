import type {
  ConsumptionEntry,
  Delivery,
  Enquiry,
  InventoryBalance,
  Mineral,
  Order,
  Organization,
  Package,
  Project,
  StockPoint,
  TemporaryExcavationApplication,
  User,
} from '@/domain';
import * as fixtures from './fixtures';

/**
 * IN-MEMORY DATABASE
 *
 * A mutable copy of the fixtures. Repositories read from here; from
 * Increment 5 onwards, confirming a receipt will write to it so that
 * inventory genuinely reflects what was received.
 *
 * That write-through behaviour is what turns the prototype from a set of
 * screens into a connected application.
 *
 * PERSISTENCE: intentionally in-memory only for now — the dataset resets on
 * reload. Session and organization context ARE persisted (see @/state), so a
 * refresh keeps you signed in and inside your package. Operational persistence
 * arrives with the first real mutation in Increment 5.
 */
export interface Database {
  users: User[];
  organizations: Organization[];
  projects: Project[];
  packages: Package[];
  minerals: Mineral[];
  stockPoints: StockPoint[];
  enquiries: Enquiry[];
  orders: Order[];
  deliveries: Delivery[];
  inventoryBalances: InventoryBalance[];
  consumptionEntries: ConsumptionEntry[];
  temporaryExcavationApplications: TemporaryExcavationApplication[];
}

function seed(): Database {
  return structuredClone({
    users: fixtures.users,
    organizations: fixtures.organizations,
    projects: fixtures.projects,
    packages: fixtures.packages,
    minerals: fixtures.minerals,
    stockPoints: fixtures.stockPoints,
    enquiries: fixtures.enquiries,
    orders: fixtures.orders,
    deliveries: fixtures.deliveries,
    inventoryBalances: fixtures.inventoryBalances,
    consumptionEntries: fixtures.consumptionEntries,
    temporaryExcavationApplications: fixtures.temporaryExcavationApplications,
  });
}

export const db: Database = seed();

/** Restores the dataset to its seeded state. Exposed as a prototype control. */
export function resetDatabase(): void {
  Object.assign(db, seed());
}
