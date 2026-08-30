/**
 * BUSINESS RULES LAYER — pure functions over domain types.
 *
 * Rules for this folder:
 *   1. No React, no UI imports, no state stores. Pure and testable.
 *   2. Every product rule that could be written in two places lives here once.
 *   3. Provisional policies are isolated in a single function so the real
 *      rule can replace them without touching any screen.
 */

export * from './access';
export * from './auth';
export * from './quantity';
export * from './inventoryRules';
export * from './inventorySummary';
export * from './attention';
export * from './enquiry';
export * from './discrepancyRules';
export * from './statusPresentation';
export * from './geo';
