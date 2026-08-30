import type { Project } from '@/domain';
import { dateDaysAgo, dateDaysAhead } from './_helpers';

/** Organization → Project (level 2 of the hierarchy). */
export const projects: Project[] = [
  {
    id: 'proj-001',
    organizationId: 'org-001',
    name: 'Mumbai–Nashik Highway Widening',
    code: 'MNH-2025',
    location: {
      line1: 'NH-160, Km 12 to Km 41',
      taluka: 'Shahapur',
      district: 'Thane',
      state: 'Maharashtra',
      pincode: '421601',
    },
    geo: { latitude: 19.45, longitude: 73.33 },
    status: 'ACTIVE',
    startDate: dateDaysAgo(310),
    expectedEndDate: dateDaysAhead(420),
  },
  {
    id: 'proj-002',
    organizationId: 'org-001',
    name: 'Pune Metro Line 3 — Civil Works',
    code: 'PMRDA-L3',
    location: {
      line1: 'Shivajinagar to Hinjawadi Corridor',
      taluka: 'Haveli',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '411005',
    },
    geo: { latitude: 18.5308, longitude: 73.8475 },
    status: 'ACTIVE',
    startDate: dateDaysAgo(180),
    expectedEndDate: dateDaysAhead(560),
  },
  {
    id: 'proj-003',
    organizationId: 'org-001',
    name: 'Nagpur Water Supply Scheme',
    code: 'NWSS-P2',
    location: {
      line1: 'Zone 2 Reservoir, Kamptee Road',
      taluka: 'Nagpur (Rural)',
      district: 'Nagpur',
      state: 'Maharashtra',
      pincode: '440026',
    },
    geo: { latitude: 21.1458, longitude: 79.0882 },
    status: 'ON_HOLD',
    startDate: dateDaysAgo(95),
  },
];
