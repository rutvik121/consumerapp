import type { TemporaryExcavationApplication } from '@/domain';
import { dateDaysAgo, dateDaysAhead, daysAgo, q } from './_helpers';

/**
 * ORGANIZATION-ONLY. There is no consumer equivalent and none should be added.
 *
 * Between them these cover every state in the two-payment lifecycle:
 *
 *   tea-001  UNDER_REVIEW         fee paid, with the department
 *   tea-002  QUERY_RAISED         department waiting on the applicant
 *   tea-003  ORDER_ISSUED         both payments made, order in hand
 *   tea-004  DRAFT                application fee not yet paid
 *   tea-005  DEMAND_NOTE_ISSUED   demand note payable now
 *
 * tea-002 and tea-005 are what surface under "Attention Required" on the
 * Organization Home — a query to answer, and money owed.
 *
 * PROVISIONAL: field shape and every fee figure are placeholders.
 */
export const temporaryExcavationApplications: TemporaryExcavationApplication[] = [
  {
    id: 'tea-001',
    applicationNumber: 'TEA/2026/001284',
    organizationId: 'org-001',
    projectId: 'proj-001',
    packageId: 'pkg-001',
    mineralId: 'min-murum',
    estimatedQuantity: q(1200),
    applicationFee: { amount: 1000, currency: 'INR' },
    purpose: 'Embankment filling for highway widening, Km 18 to Km 24.',
    siteAddress: {
      line1: 'Survey No. 118/2, Vashind',
      taluka: 'Shahapur',
      district: 'Thane',
      state: 'Maharashtra',
      pincode: '421604',
    },
    siteGeo: { latitude: 19.4482, longitude: 73.3355 },
    surveyNumber: '118/2',
    areaInSqm: 4800,
    depthInMetres: 2.5,
    fromDate: dateDaysAhead(10),
    toDate: dateDaysAhead(70),
    status: 'UNDER_REVIEW',
    submittedAt: daysAgo(11),
    statusUpdatedAt: daysAgo(7),
    documents: [
      { id: 'doc-001', fileName: 'site-plan.pdf', documentType: 'Site Plan', uploadedAt: daysAgo(11) },
      { id: 'doc-002', fileName: 'land-consent.pdf', documentType: 'Land Owner Consent', uploadedAt: daysAgo(11) },
    ],
  },
  {
    id: 'tea-002',
    applicationNumber: 'TEA/2026/001347',
    organizationId: 'org-001',
    projectId: 'proj-002',
    packageId: 'pkg-003',
    mineralId: 'min-sand',
    estimatedQuantity: q(400),
    applicationFee: { amount: 1000, currency: 'INR' },
    purpose: 'Temporary excavation for station box foundation works.',
    siteAddress: {
      line1: 'Survey No. 42/1B, Shivajinagar',
      taluka: 'Haveli',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '411005',
    },
    siteGeo: { latitude: 18.5322, longitude: 73.8461 },
    surveyNumber: '42/1B',
    areaInSqm: 1600,
    depthInMetres: 4,
    fromDate: dateDaysAhead(5),
    toDate: dateDaysAhead(45),
    status: 'QUERY_RAISED',
    submittedAt: daysAgo(9),
    statusUpdatedAt: daysAgo(2),
    statusRemarks: 'Revised site plan required with clear demarcation of excavation boundary.',
    documents: [
      { id: 'doc-003', fileName: 'site-plan-v1.pdf', documentType: 'Site Plan', uploadedAt: daysAgo(9) },
    ],
  },
  {
    id: 'tea-003',
    applicationNumber: 'TEA/2026/001102',
    organizationId: 'org-001',
    projectId: 'proj-001',
    packageId: 'pkg-002',
    mineralId: 'min-murum',
    estimatedQuantity: q(900),
    applicationFee: { amount: 1000, currency: 'INR' },
    purpose: 'Embankment filling, Km 30 to Km 36.',
    siteAddress: {
      line1: 'Survey No. 205, Kasara',
      taluka: 'Shahapur',
      district: 'Thane',
      state: 'Maharashtra',
      pincode: '421602',
    },
    siteGeo: { latitude: 19.5612, longitude: 73.4231 },
    surveyNumber: '205',
    areaInSqm: 3600,
    depthInMetres: 2,
    fromDate: dateDaysAgo(20),
    toDate: dateDaysAhead(40),
    status: 'ORDER_ISSUED',
    submittedAt: daysAgo(38),
    statusUpdatedAt: daysAgo(22),
    demandNote: {
      demandNoteNumber: 'DN/2026/004471',
      issuedAt: daysAgo(26),
      dueDate: dateDaysAgo(12),
      totalAmount: { amount: 403_200, currency: 'INR' },
      breakdown: [
        { label: 'Royalty', amount: { amount: 360_000, currency: 'INR' } },
        { label: 'District Mineral Foundation', amount: { amount: 36_000, currency: 'INR' } },
        { label: 'District cess', amount: { amount: 7_200, currency: 'INR' } },
      ],
    },
    excavationOrder: {
      orderNumber: 'EXO/2026/000884',
      issuedAt: daysAgo(22),
      validFrom: dateDaysAgo(20),
      validUntil: dateDaysAhead(40),
      permittedQuantity: q(900),
    },
    documents: [
      { id: 'doc-004', fileName: 'site-plan.pdf', documentType: 'Site Plan', uploadedAt: daysAgo(38) },
      { id: 'doc-005', fileName: 'excavation-order.pdf', documentType: 'Excavation Order', uploadedAt: daysAgo(22) },
    ],
  },
  {
    id: 'tea-004',
    applicationNumber: 'TEA/2026/DRAFT-0031',
    organizationId: 'org-001',
    projectId: 'proj-002',
    packageId: 'pkg-004',
    mineralId: 'min-gravel',
    estimatedQuantity: q(300),
    applicationFee: { amount: 1000, currency: 'INR' },
    purpose: 'Viaduct pile cap excavation.',
    siteAddress: {
      line1: 'Survey No. 77, Kharadi',
      taluka: 'Haveli',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '411014',
    },
    siteGeo: { latitude: 18.5521, longitude: 73.9362 },
    surveyNumber: '77',
    areaInSqm: 900,
    depthInMetres: 3,
    fromDate: dateDaysAhead(20),
    toDate: dateDaysAhead(60),
    status: 'DRAFT',
    statusUpdatedAt: daysAgo(1),
    documents: [],
  },

  {
    id: 'tea-005',
    applicationNumber: 'TEA/2026/001392',
    organizationId: 'org-001',
    projectId: 'proj-001',
    packageId: 'pkg-001',
    mineralId: 'min-murum',
    estimatedQuantity: q(600),
    applicationFee: { amount: 1000, currency: 'INR' },
    purpose: 'Shoulder formation, Km 24 to Km 28.',
    siteAddress: {
      line1: 'Survey No. 96, Vashind',
      taluka: 'Shahapur',
      district: 'Thane',
      state: 'Maharashtra',
      pincode: '421604',
    },
    siteGeo: { latitude: 19.4471, longitude: 73.3402 },
    surveyNumber: '96',
    areaInSqm: 2600,
    depthInMetres: 2,
    fromDate: dateDaysAhead(7),
    toDate: dateDaysAhead(67),
    status: 'DEMAND_NOTE_ISSUED',
    submittedAt: daysAgo(16),
    statusUpdatedAt: daysAgo(3),
    /* Royalty 600 MT x Rs.400, DMF at 10%, district cess at 2%. */
    demandNote: {
      demandNoteNumber: 'DN/2026/004518',
      issuedAt: daysAgo(3),
      dueDate: dateDaysAhead(11),
      totalAmount: { amount: 268_800, currency: 'INR' },
      breakdown: [
        { label: 'Royalty', amount: { amount: 240_000, currency: 'INR' } },
        { label: 'District Mineral Foundation', amount: { amount: 24_000, currency: 'INR' } },
        { label: 'District cess', amount: { amount: 4_800, currency: 'INR' } },
      ],
    },
    documents: [
      { id: 'doc-006', fileName: 'site-plan.pdf', documentType: 'Site Plan', uploadedAt: daysAgo(16) },
      { id: 'doc-007', fileName: 'demand-note.pdf', documentType: 'Demand Note', uploadedAt: daysAgo(3) },
    ],
  },
];
