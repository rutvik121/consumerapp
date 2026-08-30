import { en } from './en';
import type { Copy } from './en';

export type { Copy };

/**
 * Active copy dictionary.
 *
 * V1 is English-only by product decision. When Marathi is added, this becomes
 * locale-aware and nothing else in the app has to change.
 */
export const copy: Copy = en;

/**
 * Read UI text inside a component.
 *
 *   const t = useCopy();
 *   <span>{t.nav.home}</span>
 *
 * It returns a constant today. It exists so that switching to a real,
 * locale-aware source later is a one-file change rather than an app-wide edit.
 */
export function useCopy(): Copy {
  return copy;
}
