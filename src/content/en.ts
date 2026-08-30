/**
 * ENGLISH UI TEXT — the app's copy, in one place.
 *
 * LOCALIZATION APPROACH (deliberately minimal for V1):
 *   Marathi is NOT implemented yet, but the seam exists. To add it later:
 *     1. Add `mr.ts` with the same shape (TypeScript enforces completeness
 *        via `satisfies Copy`).
 *     2. Change `useCopy()` in ./index.ts to select by active locale.
 *     3. No component changes required — they already read from `useCopy()`.
 *
 * SCOPE RULE: put SHARED and STRUCTURAL text here — navigation, actions,
 * states, statuses, common labels. Screen-specific prose stays with its screen
 * once that screen is built, so this file does not become a dumping ground.
 * Do not centralise every string at any cost; centralise what repeats.
 */
export const en = {
  app: {
    name: 'Mahakhanij',
    tagline: 'Consumer',
  },

  /** Bottom navigation labels. Role-driven — see @/navigation/tabs.ts */
  nav: {
    home: 'Home',
    projects: 'Projects',
    mineral: 'Mineral',
    orders: 'Orders',
    more: 'More',
  },

  /** Reusable action verbs. Keep short — these sit inside touch targets. */
  actions: {
    back: 'Back',
    cancel: 'Cancel',
    confirm: 'Confirm',
    continue: 'Continue',
    close: 'Close',
    clear: 'Clear',
    retry: 'Try again',
    search: 'Search',
    signOut: 'Sign out',
    viewAll: 'View all',
    change: 'Change',
  },

  /** Shared empty / loading / error copy. */
  states: {
    loading: 'Loading',
    emptyTitle: 'Nothing here yet',
    errorTitle: 'Something went wrong',
    errorDescription: 'We could not load this. Check your connection and try again.',
  },

  /** Organization → Project → Package context. */
  context: {
    project: 'Project',
    package: 'Package',
    noProjectSelected: 'No project selected',
    noPackageSelected: 'No package selected',
  },

  /** Recurring operational field labels. */
  fields: {
    mineral: 'Mineral',
    quantity: 'Quantity',
    vehicle: 'Vehicle',
    status: 'Status',
    location: 'Location',
    destination: 'Destination',
    source: 'Source',
    stockPoint: 'Stock point',
    distance: 'Distance',
    dispatchedQuantity: 'Dispatched quantity',
    receivedQuantity: 'Received quantity',
    difference: 'Difference',
    available: 'Available',
    received: 'Received',
    consumed: 'Consumed',
    supervisor: 'Supervisor',
    etpNumber: 'e-TP number',
  },

  userType: {
    NORMAL_CONSUMER: 'Normal Consumer',
    ORGANIZATION: 'Organization',
  },

  organizationType: {
    BUILDER: 'Builder',
    CONTRACTOR: 'Contractor',
    GOVERNMENT: 'Government',
    OTHER: 'Organization',
  },

  /** PROTOTYPE-ONLY copy. Delete alongside @/prototype. */
  prototype: {
    banner: 'Prototype',
    choosePersona: 'Choose a persona',
    personaIntro:
      'Increment 1 replaces this with real authentication. For now, pick who you are signing in as.',
    switchPersona: 'Switch persona',
    demoSection: 'Prototype controls',
    notBuiltYet: 'Not built yet',
  },
} as const;

/** Shape that every future locale file must satisfy. */
export type Copy = typeof en;
