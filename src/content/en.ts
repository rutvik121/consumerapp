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

  /** Organization Home — the fixed section order from the product context. */
  organizationHome: {
    attentionRequired: 'Attention required',
    attentionClear: 'Nothing needs your attention',
    attentionClearBody: 'Deliveries, discrepancies and applications that need action will appear here.',
    businessOverview: 'Business overview',
    activeProjects: 'Active projects',
    activePackages: 'Active packages',
    activeOrders: 'Active orders',
    availableInventory: 'Available inventory',
    quickActions: 'Quick actions',
    findStockPoint: 'Find stock point',
    createEnquiry: 'Create enquiry',
    receiveMineral: 'Receive mineral',
    activeDeliveries: 'Active deliveries',
    noActiveDeliveries: 'No deliveries in transit',
    noActiveDeliveriesBody: 'Vehicles on the way to your sites will appear here.',
    trackLive: 'Track live',
    receive: 'Receive',
    inventorySnapshot: 'Inventory snapshot',
    acrossActivePackages: 'Across active packages',
    temporaryExcavation: 'Temporary excavation',
    activeApplications: 'Active applications',
    needingAttention: 'Needing attention',
    viewApplications: 'View applications',
  },

  /** Projects → Project → Packages → Package. */
  projects: {
    title: 'Projects',
    noProjects: 'No projects yet',
    noProjectsBody: 'Projects assigned to your organization will appear here.',
    packages: 'Packages',
    packageCount: (count: number) => `${count} ${count === 1 ? 'package' : 'packages'}`,
    noPackages: 'No packages in this project',
    noPackagesBody: 'Packages will appear here once they are created.',
    projectDetails: 'Project details',
    packageDetails: 'Package details',
    site: 'Site',
    mineralOperations: 'Mineral operations',
    operationsHint: 'Everything below is scoped to this package.',
    supervisorNote: 'Assigned supervisor. Supervisors work in a separate app.',
    viewInventory: 'Inventory',
    viewOrders: 'Orders',
  },

  /** Mineral acquisition: Find Stock Point → Details → Enquiry. */
  discovery: {
    title: 'Find stock point',
    searchPlaceholder: 'Stock point, taluka or district',
    filters: 'Filters',
    listView: 'List',
    mapView: 'Map',
    mineral: 'Mineral',
    anyMineral: 'Any mineral',
    withinDistance: 'Within',
    anyDistance: 'Any distance',
    inStockOnly: 'In stock only',
    apply: 'Apply',
    clearAll: 'Clear all',
    resultCount: (count: number) => `${count} ${count === 1 ? 'stock point' : 'stock points'}`,
    noResults: 'No stock points match',
    noResultsBody: 'Try widening the distance or clearing a filter.',
    noDestination: 'Select a package first',
    noDestinationBody:
      'Stock points are ranked by distance from your site, so choose the package you are sourcing for.',
    chooseProject: 'Choose a project',
    availableMinerals: 'Available minerals',
    sourceQuarry: 'Source quarry',
    licence: 'Licence',
    operatingHours: 'Operating hours',
    contact: 'Contact',
    sendEnquiry: 'Send enquiry',
    away: 'away',
  },

  /** Enquiry — never "booking", never "checkout". */
  enquiry: {
    title: 'Mineral enquiry',
    listTitle: 'Enquiries',
    newEnquiry: 'New enquiry',
    requirement: 'Your requirement',
    selectMineral: 'Mineral',
    quantityLabel: 'Required quantity',
    requiredBy: 'Required by',
    requiredByHint: 'Optional. When you need it on site.',
    remarks: 'Remarks',
    remarksPlaceholder: 'Anything the stock point should know',
    submit: 'Send enquiry',
    submitting: 'Sending…',
    sentTitle: 'Enquiry sent',
    sentBody: 'The stock point has your requirement. You can follow it here.',
    viewEnquiry: 'View enquiry',
    noEnquiries: 'No enquiries yet',
    noEnquiriesBody: 'Find a stock point and send your first mineral enquiry.',
    findStockPoint: 'Find stock point',
    enquiryNumber: 'Enquiry number',
    raisedOn: 'Raised on',
    lastUpdated: 'Last updated',
    availableHint: (value: string) => `${value} currently available`,
  },

  /** Normal Consumer home. */
  consumerHome: {
    onTheWay: 'On the way',
    needMineral: 'Need mineral?',
    needMineralBody: 'Find a stock point near you and send an enquiry.',
    recentActivity: 'Recent activity',
    noActivity: 'Nothing yet',
    noActivityBody: 'Your enquiries and orders will appear here.',
    yourInventory: 'Your inventory',
    available: 'Available',
  },

  /** Orders and transport. Tracking is operational, never a courier ETA. */
  orders: {
    title: 'Orders',
    noOrders: 'No orders yet',
    noOrdersBody: 'Orders created from your enquiries will appear here.',
    orderNumber: 'Order number',
    fromEnquiry: 'From enquiry',
    ordered: 'Ordered',
    dispatched: 'Dispatched',
    received: 'Received',
    pendingDispatch: 'Pending dispatch',
    awaitingReceipt: 'Awaiting receipt',
    dispatchStatus: 'Dispatch',
    receivingStatus: 'Receiving',
    deliveries: 'Deliveries',
    noDeliveries: 'No deliveries yet',
    noDeliveriesBody: 'Vehicles dispatched against this order will appear here.',
    placedOn: 'Placed on',
    shortReceived: 'short received',
  },

  tracking: {
    title: 'Vehicle tracking',
    driver: 'Driver',
    transporter: 'Transporter',
    lastUpdate: 'Last update',
    route: 'Route',
    source: 'Source',
    destination: 'Destination',
    transportPermit: 'Transport permit',
    permitNumber: 'e-TP number',
    permittedQuantity: 'Permitted quantity',
    validUntil: 'Valid until',
    quarry: 'Quarry',
    movement: 'Movement',
    noUpdates: 'No movement recorded yet',
    noUpdatesBody: 'Location updates will appear here once the vehicle is dispatched.',
    receiveNow: 'Receive mineral',
    arrivedNote: 'This vehicle has arrived and is waiting to be received.',
    callDriver: 'Call driver',
  },

  /** Receiving — the destination-side verification of a transport permit. */
  receiving: {
    title: 'Receive mineral',
    pickTitle: 'Vehicles at your site',
    pickBody: 'Select the vehicle in front of you, or scan its permit.',
    noArrivals: 'No vehicles waiting',
    noArrivalsBody: 'Vehicles that have arrived at your sites will appear here to be received.',
    scanTitle: 'Scan the transport permit',
    scanBody: 'Point the camera at the QR code printed on the e-TP.',
    scanAction: 'Scan QR code',
    enterManually: 'Enter e-TP number instead',
    etpLabel: 'e-TP number',
    etpHint: 'Printed at the top of the transport permit.',
    verifyAction: 'Verify permit',
    validateTitle: 'Transaction verified',
    validateFailedTitle: 'Verification failed',
    validateBody: 'This load matches the permit, the vehicle and this destination.',
    validateFailedBody:
      'Do not offload. Check the permit against the vehicle, and report the issue.',
    reportIssue: 'Report issue',
    scanAgain: 'Scan again',
    reviewTitle: 'Dispatched quantity',
    reviewBody: 'This is what the source recorded when the vehicle left.',
    weighNow: 'Enter received quantity',
    quantityTitle: 'What actually arrived?',
    quantityBody: 'Enter the quantity measured at your site.',
    receivedLabel: 'Received quantity',
    dispatched: 'Dispatched',
    received: 'Received',
    difference: 'Difference',
    matches: 'Received quantity matches dispatch.',
    shortage: 'Shortage',
    excess: 'Excess',
    reasonLabel: 'Reason for the difference',
    reasonPlaceholder: 'Select a reason',
    remarksLabel: 'Remarks',
    remarksPlaceholder: 'How and where the quantity was measured',
    confirmAction: 'Confirm receipt',
    confirmTitle: 'Confirm receipt?',
    confirmBody: 'This records the received quantity and updates your inventory.',
    confirmBodyDiscrepancy:
      'A difference will be recorded against this delivery. This updates your inventory.',
    confirming: 'Recording…',
    doneTitle: 'Receipt confirmed',
    doneBody: 'Inventory has been updated.',
    nowAvailable: 'Now available',
    viewDelivery: 'View delivery',
    backHome: 'Back to home',
    reason: {
      TRANSIT_LOSS: 'Loss in transit',
      MEASUREMENT_DIFFERENCE: 'Measurement difference',
      PARTIAL_OFFLOAD: 'Partial offload',
      OTHER: 'Other',
    },
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
