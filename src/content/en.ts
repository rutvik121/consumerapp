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

  /** Authentication — Splash → Login/Register → Mobile → OTP → Experience. */
  auth: {
    welcomeTitle: 'Mineral, from source to site',
    welcomeBody:
      'Find a stock point, raise an enquiry, track the vehicle, verify what arrives, and manage what you use.',
    signIn: 'Sign in',
    createAccount: 'Create account',

    mobileLabel: 'Mobile number',
    mobilePlaceholder: '10-digit number',
    mobileHint: 'We will send a 6-digit verification code to this number.',
    mobileInvalid: 'Enter a valid 10-digit Indian mobile number.',

    verifyTitle: 'Verify your number',
    verifySentTo: 'Enter the 6-digit code sent to',
    changeNumber: 'Change',
    resendIn: 'Resend code in',
    resend: 'Resend code',
    resent: 'A new code has been sent.',
    otpInvalid: 'That code is not correct. Please try again.',
    noAccount: 'No account exists for this number.',
    alreadyRegistered: 'An account already exists for this number.',

    registerTitle: 'Create account',
    userTypeQuestion: 'How will you use Mahakhanij?',
    userTypeHelp: 'This decides what the app shows you. It cannot be changed later.',
    consumerSummary: 'For an individual buying mineral for personal use.',
    organizationSummary:
      'For a builder, contractor, government body or any other organization working across projects and packages.',

    detailsTitle: 'Your details',
    fullNameLabel: 'Full name',

    organizationTitle: 'Organization details',
    organizationNameLabel: 'Organization name',
    organizationTypeLabel: 'Organization type',
    organizationTypeHint: 'Every organization type uses the same experience.',
    registrationNumberLabel: 'Mahakhanij registration number',

    deliveryTitle: 'Where should mineral be delivered?',
    deliveryHelp: 'Used to find nearby stock points and to verify deliveries on arrival.',
    addressLabel: 'Address',
    talukaLabel: 'Taluka',
    districtLabel: 'District',
    pincodeLabel: 'PIN code',
    pincodeInvalid: 'Enter a valid 6-digit PIN code.',

    required: 'This field is required.',
    haveAccount: 'Already have an account?',
    noAccountYet: 'New to Mahakhanij?',
  },

  /** PROTOTYPE-ONLY copy. Delete alongside @/prototype. */
  prototype: {
    banner: 'Prototype',
    choosePersona: 'Choose a persona',
    personaIntro:
      'A review shortcut that skips authentication. The real sign-in flow is on the entry screen.',
    switchPersona: 'Switch persona',
    demoSection: 'Prototype controls',
    notBuiltYet: 'Not built yet',
    otpHint: 'Prototype — the code is 123456. Any other code shows the error state.',
    seededAccounts: 'Seeded accounts: 9822014576 (Organization) · 9730845120 (Normal Consumer)',
  },
} as const;

/** Shape that every future locale file must satisfy. */
export type Copy = typeof en;
