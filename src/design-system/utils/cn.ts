import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge must be told about our custom token scales, otherwise it
 * cannot tell `text-body` (a font size) apart from `text-ink` (a colour) and
 * would drop one when merging overrides.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display',
            'title-lg',
            'title',
            'body-lg',
            'body',
            'body-sm',
            'label',
            'caption',
            'overline',
          ],
        },
      ],
      shadow: [{ shadow: ['e1', 'e2', 'e3'] }],
    },
  },
});

/** Compose class names with correct Tailwind conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
