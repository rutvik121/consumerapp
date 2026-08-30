import type { Package } from '@/domain';
import { dateDaysAgo, dateDaysAhead } from './_helpers';

/**
 * Project → Package (level 3) — and THE operational scope.
 *
 * Every organization mineral operation hangs off one of these. The site
 * address doubles as the delivery destination verified during receiving.
 *
 * `supervisor` is read-only context. Supervisors work in a separate app.
 */
export const packages: Package[] = [
  {
    id: 'pkg-001',
    projectId: 'proj-001',
    organizationId: 'org-001',
    name: 'Package A — Km 12 to Km 28',
    code: 'MNH-PKG-A',
    siteAddress: {
      line1: 'NH-160 Km 18, Vashind',
      taluka: 'Shahapur',
      district: 'Thane',
      state: 'Maharashtra',
      pincode: '421604',
    },
    siteGeo: { latitude: 19.45, longitude: 73.33 },
    status: 'ACTIVE',
    startDate: dateDaysAgo(300),
    expectedEndDate: dateDaysAhead(240),
    supervisor: { name: 'S. R. Pawar', mobileNumber: '9145220087', employeeCode: 'SUP-4417' },
  },
  {
    id: 'pkg-002',
    projectId: 'proj-001',
    organizationId: 'org-001',
    name: 'Package B — Km 28 to Km 41',
    code: 'MNH-PKG-B',
    siteAddress: {
      line1: 'NH-160 Km 34, Kasara',
      taluka: 'Shahapur',
      district: 'Thane',
      state: 'Maharashtra',
      pincode: '421602',
    },
    siteGeo: { latitude: 19.56, longitude: 73.42 },
    status: 'ACTIVE',
    startDate: dateDaysAgo(240),
    expectedEndDate: dateDaysAhead(300),
    supervisor: { name: 'M. A. Kulkarni', mobileNumber: '9028117744', employeeCode: 'SUP-4482' },
  },
  {
    id: 'pkg-003',
    projectId: 'proj-002',
    organizationId: 'org-001',
    name: 'Package C — Station Box CH-04',
    code: 'PML3-PKG-C',
    siteAddress: {
      line1: 'Shivajinagar Station Box, Ganeshkhind Road',
      taluka: 'Haveli',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '411005',
    },
    siteGeo: { latitude: 18.5308, longitude: 73.8475 },
    status: 'ACTIVE',
    startDate: dateDaysAgo(170),
    expectedEndDate: dateDaysAhead(400),
    supervisor: { name: 'D. P. Jadhav', mobileNumber: '9011456623', employeeCode: 'SUP-5109' },
  },
  {
    id: 'pkg-004',
    projectId: 'proj-002',
    organizationId: 'org-001',
    name: 'Package D — Viaduct Segment V2',
    code: 'PML3-PKG-D',
    siteAddress: {
      line1: 'Kharadi Bypass Viaduct',
      taluka: 'Haveli',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '411014',
    },
    siteGeo: { latitude: 18.5515, longitude: 73.935 },
    status: 'ACTIVE',
    startDate: dateDaysAgo(120),
    expectedEndDate: dateDaysAhead(460),
  },
  {
    id: 'pkg-005',
    projectId: 'proj-003',
    organizationId: 'org-001',
    name: 'Package E — Reservoir Zone 2',
    code: 'NWSS-PKG-E',
    siteAddress: {
      line1: 'Zone 2 Reservoir Site, Kamptee Road',
      taluka: 'Nagpur (Rural)',
      district: 'Nagpur',
      state: 'Maharashtra',
      pincode: '440026',
    },
    siteGeo: { latitude: 21.1458, longitude: 79.0882 },
    status: 'ON_HOLD',
    startDate: dateDaysAgo(90),
  },
];
