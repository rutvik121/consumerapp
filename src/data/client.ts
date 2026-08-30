/**
 * MOCK TRANSPORT LAYER
 *
 * Every repository call goes through `request()`, which is deliberately
 * asynchronous and deliberately slow enough to be perceptible.
 *
 * Why this matters for a prototype: if data arrives synchronously, screens get
 * built without loading states, and the real application then has to retrofit
 * them everywhere. Making the mock behave like a network forces the correct
 * shape from the first screen.
 *
 * REPLACING THIS WITH A REAL API:
 *   `request()` is the only seam. Swap its body for `fetch()` and the
 *   repositories above it need no changes.
 */

const MIN_LATENCY_MS = 120;
const MAX_LATENCY_MS = 320;

function randomLatency(): number {
  return MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS);
}

/** Resolves with a deep-cloned result after a realistic delay. */
export function request<T>(produce: () => T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Cloned so callers can never mutate the store by holding a reference.
      resolve(structuredClone(produce()));
    }, randomLatency());
  });
}

/** Thrown when an entity lookup by id fails. Repositories return null instead
 *  where absence is an expected outcome; this is for genuine integrity errors. */
export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`);
    this.name = 'NotFoundError';
  }
}
