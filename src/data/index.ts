/**
 * DATA LAYER
 *
 *   fixtures/     raw seed records, one file per entity
 *   db.ts         mutable in-memory store, seeded from fixtures
 *   client.ts     the network seam — replace with fetch() for a real API
 *   repositories/ the only interface screens are allowed to use
 */
export * from './repositories';
export { resetDatabase } from './db';
export { NotFoundError } from './client';
