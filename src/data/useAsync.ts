import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  /** Re-runs the query. Wired to the retry action on ErrorState. */
  reload: () => void;
}

/**
 * Runs a repository query and exposes loading / error / data.
 *
 * Every screen that reads data uses this, so the three states are handled
 * consistently rather than each screen inventing its own. That is what makes
 * "support loading, empty, and error states" a property of the architecture
 * instead of a checklist item that gets forgotten on the fifth screen.
 *
 * `deps` behaves like useEffect's dependency array — the query re-runs when
 * they change. A stale response from a superseded run is discarded.
 */
export function useAsync<T>(query: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Kept in a ref so `deps` alone controls re-running, not the function identity.
  const queryRef = useRef(query);
  queryRef.current = query;

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    queryRef
      .current()
      .then((result) => {
        if (cancelled) return;
        setData(result);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(caught instanceof Error ? caught : new Error(String(caught)));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  return { data, loading, error, reload };
}
