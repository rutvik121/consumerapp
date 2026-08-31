import type { GeoPoint } from '@/domain';

/**
 * ADMINISTRATIVE LOCATION MASTER.
 *
 * District → Taluka → Village, the cascade every Maharashtra land record uses
 * and the one the web form asks for. Each level carries a centroid so the map
 * picker can suggest the administrative unit for a dropped pin, and so the
 * picker can open somewhere sensible rather than at 0,0.
 *
 * PROVISIONAL: a real build reads this from the Mahakhanij location master and
 * covers all 36 districts. This is a working subset chosen to cover the sites
 * already in the dataset.
 */
export interface VillageRecord {
  code: string;
  name: string;
  geo: GeoPoint;
}

export interface TalukaRecord {
  code: string;
  name: string;
  geo: GeoPoint;
  villages: VillageRecord[];
}

export interface DistrictRecord {
  code: string;
  name: string;
  geo: GeoPoint;
  talukas: TalukaRecord[];
}

export const districts: DistrictRecord[] = [
  {
    code: 'THN',
    name: 'Thane',
    geo: { latitude: 19.3, longitude: 73.1 },
    talukas: [
      {
        code: 'THN-SHP',
        name: 'Shahapur',
        geo: { latitude: 19.45, longitude: 73.33 },
        villages: [
          { code: 'THN-SHP-VSH', name: 'Vashind', geo: { latitude: 19.4482, longitude: 73.3355 } },
          { code: 'THN-SHP-KSR', name: 'Kasara', geo: { latitude: 19.5612, longitude: 73.4231 } },
          { code: 'THN-SHP-ATG', name: 'Atgaon', geo: { latitude: 19.5008, longitude: 73.3702 } },
        ],
      },
      {
        code: 'THN-KLY',
        name: 'Kalyan',
        geo: { latitude: 19.2403, longitude: 73.1305 },
        villages: [
          { code: 'THN-KLY-TTW', name: 'Titwala', geo: { latitude: 19.2957, longitude: 73.2043 } },
          { code: 'THN-KLY-AMB', name: 'Ambivli', geo: { latitude: 19.2611, longitude: 73.1737 } },
        ],
      },
      {
        code: 'THN-BHW',
        name: 'Bhiwandi',
        geo: { latitude: 19.2813, longitude: 73.0483 },
        villages: [
          { code: 'THN-BHW-MNK', name: 'Mankoli', geo: { latitude: 19.2478, longitude: 73.0641 } },
          { code: 'THN-BHW-KLH', name: 'Kalher', geo: { latitude: 19.2334, longitude: 73.0399 } },
        ],
      },
    ],
  },
  {
    code: 'PUN',
    name: 'Pune',
    geo: { latitude: 18.5204, longitude: 73.8567 },
    talukas: [
      {
        code: 'PUN-HVL',
        name: 'Haveli',
        geo: { latitude: 18.5515, longitude: 73.935 },
        villages: [
          { code: 'PUN-HVL-WGH', name: 'Wagholi', geo: { latitude: 18.5793, longitude: 73.9781 } },
          { code: 'PUN-HVL-KHD', name: 'Kharadi', geo: { latitude: 18.5515, longitude: 73.935 } },
          { code: 'PUN-HVL-LNK', name: 'Lonikand', geo: { latitude: 18.6045, longitude: 73.9866 } },
        ],
      },
      {
        code: 'PUN-KHD',
        name: 'Khed',
        geo: { latitude: 18.7606, longitude: 73.8636 },
        villages: [
          { code: 'PUN-KHD-CHK', name: 'Chakan', geo: { latitude: 18.7606, longitude: 73.8636 } },
          { code: 'PUN-KHD-ALN', name: 'Alandi', geo: { latitude: 18.6771, longitude: 73.8987 } },
        ],
      },
    ],
  },
  {
    code: 'NSK',
    name: 'Nashik',
    geo: { latitude: 19.9975, longitude: 73.7898 },
    talukas: [
      {
        code: 'NSK-NSK',
        name: 'Nashik',
        geo: { latitude: 19.9975, longitude: 73.7898 },
        villages: [
          { code: 'NSK-NSK-PTD', name: 'Pathardi', geo: { latitude: 19.9698, longitude: 73.7431 } },
          { code: 'NSK-NSK-DWR', name: 'Dwarka', geo: { latitude: 19.9793, longitude: 73.8143 } },
        ],
      },
      {
        code: 'NSK-IGT',
        name: 'Igatpuri',
        geo: { latitude: 19.6957, longitude: 73.5626 },
        villages: [
          { code: 'NSK-IGT-GHT', name: 'Ghoti', geo: { latitude: 19.7156, longitude: 73.6323 } },
        ],
      },
    ],
  },
  {
    code: 'NGP',
    name: 'Nagpur',
    geo: { latitude: 21.1458, longitude: 79.0882 },
    talukas: [
      {
        code: 'NGP-KMP',
        name: 'Kamptee',
        geo: { latitude: 21.2333, longitude: 79.1967 },
        villages: [
          { code: 'NGP-KMP-KNH', name: 'Kanhan', geo: { latitude: 21.2604, longitude: 79.2087 } },
        ],
      },
      {
        code: 'NGP-NGR',
        name: 'Nagpur (Rural)',
        geo: { latitude: 21.1458, longitude: 79.0882 },
        villages: [
          { code: 'NGP-NGR-WDI', name: 'Wadi', geo: { latitude: 21.1401, longitude: 78.9861 } },
        ],
      },
    ],
  },
];
