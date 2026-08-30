/**
 * DOMAIN LAYER — product concepts only.
 *
 * Rules for this folder:
 *   1. Types describe the PRODUCT, not any screen or component.
 *   2. No imports from @/design-system, @/screens, @/state, or @/data.
 *   3. Anything provisional carries an explicit comment naming the open
 *      question, so the future team knows what is confirmed vs. assumed.
 *
 * The twelve V1 entities:
 *   User · Organization · Project · Package · StockPoint · Mineral ·
 *   Enquiry · Order · Delivery · Inventory · Consumption ·
 *   TemporaryExcavationApplication
 */

export * from './common';
export * from './user';
export * from './organization';
export * from './project';
export * from './package';
export * from './mineral';
export * from './stockPoint';
export * from './enquiry';
export * from './order';
export * from './delivery';
export * from './inventory';
export * from './consumption';
export * from './temporaryExcavation';
