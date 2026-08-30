import type { StockPoint } from '@/domain';
import { q } from './_helpers';

/**
 * The source side of the journey.
 *
 * Note `sourceQuarryName` and `licenceNumber` — upstream provenance from the
 * wider Mahakhanij ecosystem, surfaced read-only so the consumer can see where
 * their mineral actually originates. This is traceability, not decoration.
 *
 * No price fields — deliberately. See StockPointMineralAvailability.
 */
export const stockPoints: StockPoint[] = [
  {
    id: 'sp-001',
    name: 'Kalyan Stock Point',
    code: 'SP-TH-014',
    address: {
      line1: 'Near Durgadi Fort, Kalyan West',
      taluka: 'Kalyan',
      district: 'Thane',
      state: 'Maharashtra',
      pincode: '421301',
    },
    geo: { latitude: 19.2403, longitude: 73.1305 },
    status: 'OPERATIONAL',
    operatingHours: '07:00 – 19:00',
    contact: { name: 'V. B. More', mobileNumber: '9860221145' },
    sourceQuarryName: 'Titwala Trap Quarry',
    licenceNumber: 'MH/TH/QRY/2024/0231',
    minerals: [
      { mineralId: 'min-grit', availableQuantity: q(2400) },
      { mineralId: 'min-trap', availableQuantity: q(1850) },
      { mineralId: 'min-gravel', availableQuantity: q(620) },
    ],
  },
  {
    id: 'sp-002',
    name: 'Bhiwandi Mineral Depot',
    code: 'SP-TH-027',
    address: {
      line1: 'Mankoli Naka, Bhiwandi',
      taluka: 'Bhiwandi',
      district: 'Thane',
      state: 'Maharashtra',
      pincode: '421302',
    },
    geo: { latitude: 19.2813, longitude: 73.0483 },
    status: 'OPERATIONAL',
    operatingHours: '06:30 – 20:00',
    contact: { name: 'A. K. Shaikh', mobileNumber: '9821447790' },
    sourceQuarryName: 'Ulhas River Sand Ghat',
    licenceNumber: 'MH/TH/QRY/2024/0198',
    minerals: [
      { mineralId: 'min-sand', availableQuantity: q(1120) },
      { mineralId: 'min-murum', availableQuantity: q(3200) },
    ],
  },
  {
    id: 'sp-003',
    name: 'Chakan Stock Yard',
    code: 'SP-PN-008',
    address: {
      line1: 'MIDC Phase II, Chakan',
      taluka: 'Khed',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '410501',
    },
    geo: { latitude: 18.7606, longitude: 73.8636 },
    status: 'LIMITED_STOCK',
    operatingHours: '08:00 – 18:00',
    contact: { name: 'P. S. Gaikwad', mobileNumber: '9765330018' },
    sourceQuarryName: 'Chakan Basalt Quarry',
    licenceNumber: 'MH/PN/QRY/2023/0442',
    minerals: [
      { mineralId: 'min-grit', availableQuantity: q(140) },
      { mineralId: 'min-trap', availableQuantity: q(95) },
    ],
  },
  {
    id: 'sp-004',
    name: 'Wagholi Stock Point',
    code: 'SP-PN-019',
    address: {
      line1: 'Pune–Nagar Road, Wagholi',
      taluka: 'Haveli',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '412207',
    },
    geo: { latitude: 18.5793, longitude: 73.9781 },
    status: 'OPERATIONAL',
    operatingHours: '07:00 – 19:00',
    contact: { name: 'R. N. Thorat', mobileNumber: '9096114228' },
    sourceQuarryName: 'Lonikand Murum Quarry',
    licenceNumber: 'MH/PN/QRY/2024/0507',
    minerals: [
      { mineralId: 'min-murum', availableQuantity: q(4100) },
      { mineralId: 'min-gravel', availableQuantity: q(880) },
      { mineralId: 'min-grit', availableQuantity: q(1560) },
    ],
  },
  {
    id: 'sp-005',
    name: 'Kamptee Stock Point',
    code: 'SP-NG-003',
    address: {
      line1: 'Kamptee Road, Near Kanhan Bridge',
      taluka: 'Kamptee',
      district: 'Nagpur',
      state: 'Maharashtra',
      pincode: '441002',
    },
    geo: { latitude: 21.2333, longitude: 79.1967 },
    status: 'CLOSED',
    operatingHours: 'Temporarily closed',
    contact: { name: 'S. D. Meshram', mobileNumber: '9422558831' },
    sourceQuarryName: 'Kanhan River Sand Ghat',
    licenceNumber: 'MH/NG/QRY/2023/0119',
    minerals: [{ mineralId: 'min-sand', availableQuantity: q(0) }],
  },
  {
    id: 'sp-006',
    name: 'Nashik Road Stock Point',
    code: 'SP-NS-011',
    address: {
      line1: 'Behind Bytco Point, Nashik Road',
      taluka: 'Nashik',
      district: 'Nashik',
      state: 'Maharashtra',
      pincode: '422101',
    },
    geo: { latitude: 19.949, longitude: 73.84 },
    status: 'OPERATIONAL',
    operatingHours: '07:30 – 18:30',
    contact: { name: 'K. J. Bhosale', mobileNumber: '9730112264' },
    sourceQuarryName: 'Godavari Sand Ghat',
    licenceNumber: 'MH/NS/QRY/2024/0288',
    minerals: [
      { mineralId: 'min-sand', availableQuantity: q(760) },
      { mineralId: 'min-grit', availableQuantity: q(540) },
      { mineralId: 'min-murum', availableQuantity: q(1300) },
    ],
  },
];
