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
  Payment,
  SupervisorInfo,
  TemporaryExcavationApplication,
  User,
} from '@/domain';
import * as fixtures from './fixtures';

/**
 * IN-MEMORY DATABASE
 */
export interface Database {
  users: User[];
  organizations: Organization[];
  projects: Project[];
  packages: Package[];
  supervisors: SupervisorInfo[];
  minerals: Mineral[];
  stockPoints: StockPoint[];
  enquiries: Enquiry[];
  orders: Order[];
  deliveries: Delivery[];
  inventoryBalances: InventoryBalance[];
  consumptionEntries: ConsumptionEntry[];
  temporaryExcavationApplications: TemporaryExcavationApplication[];
  payments: Payment[];
}

function seed(): Database {
  return structuredClone({
    users: fixtures.users,
    organizations: fixtures.organizations,
    projects: fixtures.projects,
    packages: fixtures.packages,
    supervisors: [
      {
        id: 'sup-1',
        name: 'S. R. Pawar',
        mobileNumber: '9145220087',
        employeeCode: 'SUP-4417',
        assignedPackageId: 'pkg-001',
        assignedPackageName: 'Package A — Km 12 to Km 28',
      },
      {
        id: 'sup-2',
        name: 'M. A. Kulkarni',
        mobileNumber: '9028117744',
        employeeCode: 'SUP-4482',
        assignedPackageId: 'pkg-002',
        assignedPackageName: 'Package B — Km 28 to Km 41',
      },
      {
        id: 'sup-3',
        name: 'D. P. Jadhav',
        mobileNumber: '9011456623',
        employeeCode: 'SUP-5109',
        assignedPackageId: 'pkg-003',
        assignedPackageName: 'Package C — Station Box CH-04',
      },
      {
        id: 'sup-4',
        name: 'R. K. Shinde',
        mobileNumber: '9822334455',
        employeeCode: 'SUP-5220',
      },
      {
        id: 'sup-5',
        name: 'V. S. Deshmukh',
        mobileNumber: '9890123456',
        employeeCode: 'SUP-5331',
      },
      {
        id: 'sup-6',
        name: 'A. N. More',
        mobileNumber: '9765432100',
        employeeCode: 'SUP-5442',
      },
    ],
    minerals: fixtures.minerals,
    stockPoints: fixtures.stockPoints,
    enquiries: fixtures.enquiries,
    orders: fixtures.orders,
    deliveries: fixtures.deliveries,
    inventoryBalances: fixtures.inventoryBalances,
    consumptionEntries: fixtures.consumptionEntries,
    temporaryExcavationApplications: fixtures.temporaryExcavationApplications,
    payments: fixtures.payments,
  });
}

export const db: Database = seed();

/** Restores the dataset to its seeded state. Exposed as a prototype control. */
export function resetDatabase(): void {
  Object.assign(db, seed());
}
