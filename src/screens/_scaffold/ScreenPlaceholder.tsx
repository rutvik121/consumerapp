import { Hammer } from 'lucide-react';
import { Surface } from '@/design-system';

export interface ScreenPlaceholderProps {
  /** Which increment builds this screen. */
  increment: string;
  /** The question this screen will answer for the user. */
  purpose: string;
  /** What will actually be on it. */
  contents: string[];
}

/**
 * SCAFFOLD MARKER — deliberately not a mock-up.
 *
 * Increment 0 builds the foundation, not product screens. Rather than filling
 * routes with invented dashboards that would have to be thrown away — and that
 * would misrepresent progress in a review — each route states plainly what it
 * will become and when.
 *
 * Each of these is replaced by the real screen in the increment named. The
 * folder disappears once every route is built.
 */
export function ScreenPlaceholder({ increment, purpose, contents }: ScreenPlaceholderProps) {
  return (
    <div className="px-4 py-6">
      <Surface variant="outlined" rounded padded className="border-dashed">
        <div className="flex items-center gap-2">
          <Hammer size={15} className="shrink-0 text-ink-muted" aria-hidden />
          <span className="text-overline text-ink-muted uppercase">{increment}</span>
        </div>

        <p className="mt-3 text-body text-ink">{purpose}</p>

        <ul className="mt-4 space-y-1.5">
          {contents.map((item) => (
            <li key={item} className="flex gap-2 text-body-sm text-ink-secondary">
              <span aria-hidden className="text-neutral-300">
                •
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Surface>
    </div>
  );
}
