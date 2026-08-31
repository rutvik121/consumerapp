/**
 * FIXTURES — the raw seed data, one file per entity.
 *
 * RULES:
 *   1. Mock data NEVER lives inside a screen or component.
 *   2. Screens read through repositories, never from fixtures directly.
 *   3. The dataset is a connected graph, not a pile of unrelated records:
 *
 *        Organization → Projects → Packages
 *        Package → Enquiries → Orders → Deliveries
 *        Delivery → Receipt → Inventory → Consumption
 *
 *      Follow any id in one file and it resolves in another. That is what
 *      lets the prototype behave like a real application.
 */
export * from './_helpers';
export * from './users';
export * from './organizations';
export * from './projects';
export * from './packages';
export * from './minerals';
export * from './stockPoints';
export * from './enquiries';
export * from './orders';
export * from './deliveries';
export * from './inventory';
export * from './consumption';
export * from './temporaryExcavation';
export * from './payments';
export * from './locations';
