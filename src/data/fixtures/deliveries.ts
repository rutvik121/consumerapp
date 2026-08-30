import type { Delivery } from '@/domain';
import { ORGANIZATION_USER_ID } from './users';
import { daysAgo, hoursAgo, q } from './_helpers';

/**
 * The traceability backbone of the dataset.
 *
 * Each delivery is a permit-backed transport transaction — an e-TP with a
 * source quarry, a designated destination, a vehicle, a mineral and a
 * permitted quantity. Receiving verifies this record; it does not create it.
 *
 * The four deliveries below deliberately cover every receiving state the
 * product must handle:
 *
 *   del-001  RECEIVED                    — clean receipt, no difference
 *   del-002  RECEIVED_WITH_DISCREPANCY   — 50 dispatched, 47 received, 3 short
 *   del-003  ARRIVED_AT_DESTINATION      — waiting to be received RIGHT NOW
 *   del-004  IN_TRANSIT                  — consumer delivery, still moving
 *
 * del-003 is what drives "Attention Required" on the Organization Home.
 * del-004 is what the Normal Consumer tracks.
 */
export const deliveries: Delivery[] = [
  {
    id: 'del-001',
    deliveryNumber: 'DLV/2026/019740',
    orderId: 'ord-001',
    organizationId: 'org-001',
    projectId: 'proj-001',
    packageId: 'pkg-001',
    permit: {
      etpNumber: 'ETP/2026/MH/0431188',
      qrPayload: 'MHKNJ:ETP:2026:MH:0431188',
      issuedAt: daysAgo(9, '07:10:00'),
      validUntil: daysAgo(8, '07:10:00'),
      sourceQuarryName: 'Titwala Trap Quarry',
      sourceStockPointId: 'sp-001',
      destinationLabel: 'Package A — Km 12 to Km 28',
      destinationGeo: { latitude: 19.45, longitude: 73.33 },
      mineralId: 'min-grit',
      permittedQuantity: q(50),
      vehicleNumber: 'MH-04-GG-1234',
    },
    vehicle: {
      registrationNumber: 'MH-04-GG-1234',
      transporterName: 'Konkan Roadlines',
      driverName: 'Suresh Patil',
      driverMobileNumber: '9820117453',
    },
    destination: {
      label: 'Package A — Km 12 to Km 28',
      address: {
        line1: 'NH-160 Km 18, Vashind',
        taluka: 'Shahapur',
        district: 'Thane',
        state: 'Maharashtra',
        pincode: '421604',
      },
      geo: { latitude: 19.45, longitude: 73.33 },
    },
    dispatchedQuantity: q(50),
    status: 'RECEIVED',
    dispatchedAt: daysAgo(9, '07:40:00'),
    expectedArrivalAt: daysAgo(9, '11:00:00'),
    arrivedAt: daysAgo(9, '10:52:00'),
    tracking: [
      { at: daysAgo(9, '07:40:00'), status: 'DISPATCHED', locationLabel: 'Kalyan Stock Point', geo: { latitude: 19.2403, longitude: 73.1305 } },
      { at: daysAgo(9, '09:05:00'), status: 'IN_TRANSIT', locationLabel: 'Titwala Checkpost', geo: { latitude: 19.2957, longitude: 73.2043 } },
      { at: daysAgo(9, '10:52:00'), status: 'ARRIVED_AT_DESTINATION', locationLabel: 'Package A Site Gate', geo: { latitude: 19.45, longitude: 73.33 } },
      { at: daysAgo(9, '11:20:00'), status: 'RECEIVED', locationLabel: 'Package A — Km 12 to Km 28', note: 'Quantity matched dispatch.' },
    ],
    receipt: {
      receivedAt: daysAgo(9, '11:20:00'),
      receivedByUserId: ORGANIZATION_USER_ID,
      verification: { qrScanned: true, permitValid: true, vehicleMatched: true, destinationMatched: true },
      dispatchedQuantity: q(50),
      receivedQuantity: q(50),
      differenceQuantity: q(0),
      hasDiscrepancy: false,
    },
  },

  {
    id: 'del-002',
    deliveryNumber: 'DLV/2026/019902',
    orderId: 'ord-001',
    organizationId: 'org-001',
    projectId: 'proj-001',
    packageId: 'pkg-001',
    permit: {
      etpNumber: 'ETP/2026/MH/0433027',
      qrPayload: 'MHKNJ:ETP:2026:MH:0433027',
      issuedAt: daysAgo(2, '06:55:00'),
      validUntil: daysAgo(1, '06:55:00'),
      sourceQuarryName: 'Titwala Trap Quarry',
      sourceStockPointId: 'sp-001',
      destinationLabel: 'Package A — Km 12 to Km 28',
      destinationGeo: { latitude: 19.45, longitude: 73.33 },
      mineralId: 'min-grit',
      permittedQuantity: q(50),
      vehicleNumber: 'MH-04-JK-8891',
    },
    vehicle: {
      registrationNumber: 'MH-04-JK-8891',
      transporterName: 'Konkan Roadlines',
      driverName: 'Ramesh Jadhav',
      driverMobileNumber: '9867224180',
    },
    destination: {
      label: 'Package A — Km 12 to Km 28',
      address: {
        line1: 'NH-160 Km 18, Vashind',
        taluka: 'Shahapur',
        district: 'Thane',
        state: 'Maharashtra',
        pincode: '421604',
      },
      geo: { latitude: 19.45, longitude: 73.33 },
    },
    dispatchedQuantity: q(50),
    status: 'RECEIVED_WITH_DISCREPANCY',
    dispatchedAt: daysAgo(2, '07:25:00'),
    expectedArrivalAt: daysAgo(2, '10:45:00'),
    arrivedAt: daysAgo(2, '11:08:00'),
    tracking: [
      { at: daysAgo(2, '07:25:00'), status: 'DISPATCHED', locationLabel: 'Kalyan Stock Point', geo: { latitude: 19.2403, longitude: 73.1305 } },
      { at: daysAgo(2, '09:40:00'), status: 'IN_TRANSIT', locationLabel: 'Titwala Checkpost', geo: { latitude: 19.2957, longitude: 73.2043 } },
      { at: daysAgo(2, '11:08:00'), status: 'ARRIVED_AT_DESTINATION', locationLabel: 'Package A Site Gate', geo: { latitude: 19.45, longitude: 73.33 } },
      { at: daysAgo(2, '11:46:00'), status: 'RECEIVED_WITH_DISCREPANCY', locationLabel: 'Package A — Km 12 to Km 28', note: 'Shortage of 3 MT recorded at site weighbridge.' },
    ],
    receipt: {
      receivedAt: daysAgo(2, '11:46:00'),
      receivedByUserId: ORGANIZATION_USER_ID,
      verification: { qrScanned: true, permitValid: true, vehicleMatched: true, destinationMatched: true },
      dispatchedQuantity: q(50),
      receivedQuantity: q(47),
      differenceQuantity: q(3),
      hasDiscrepancy: true,
      discrepancyReason: 'TRANSIT_LOSS',
      remarks: 'Weighed at site weighbridge in presence of transporter.',
    },
  },

  {
    id: 'del-003',
    deliveryNumber: 'DLV/2026/020115',
    orderId: 'ord-002',
    organizationId: 'org-001',
    projectId: 'proj-002',
    packageId: 'pkg-003',
    permit: {
      etpNumber: 'ETP/2026/MH/0436610',
      qrPayload: 'MHKNJ:ETP:2026:MH:0436610',
      issuedAt: hoursAgo(7),
      validUntil: hoursAgo(-17),
      sourceQuarryName: 'Lonikand Murum Quarry',
      sourceStockPointId: 'sp-004',
      destinationLabel: 'Package C — Station Box CH-04',
      destinationGeo: { latitude: 18.5308, longitude: 73.8475 },
      mineralId: 'min-murum',
      permittedQuantity: q(40),
      vehicleNumber: 'MH-12-KL-7788',
    },
    vehicle: {
      registrationNumber: 'MH-12-KL-7788',
      transporterName: 'Deccan Carriers',
      driverName: 'Balu Shinde',
      driverMobileNumber: '9922441087',
    },
    destination: {
      label: 'Package C — Station Box CH-04',
      address: {
        line1: 'Shivajinagar Station Box, Ganeshkhind Road',
        taluka: 'Haveli',
        district: 'Pune',
        state: 'Maharashtra',
        pincode: '411005',
      },
      geo: { latitude: 18.5308, longitude: 73.8475 },
    },
    dispatchedQuantity: q(40),
    status: 'ARRIVED_AT_DESTINATION',
    dispatchedAt: hoursAgo(6),
    expectedArrivalAt: hoursAgo(1),
    arrivedAt: hoursAgo(1),
    tracking: [
      { at: hoursAgo(6), status: 'DISPATCHED', locationLabel: 'Wagholi Stock Point', geo: { latitude: 18.5793, longitude: 73.9781 } },
      { at: hoursAgo(4), status: 'IN_TRANSIT', locationLabel: 'Kharadi Bypass', geo: { latitude: 18.5515, longitude: 73.935 } },
      { at: hoursAgo(2), status: 'IN_TRANSIT', locationLabel: 'Yerwada', geo: { latitude: 18.5497, longitude: 73.8797 } },
      { at: hoursAgo(1), status: 'ARRIVED_AT_DESTINATION', locationLabel: 'Package C Site Gate', geo: { latitude: 18.5308, longitude: 73.8475 }, note: 'Vehicle waiting at gate for receiving.' },
    ],
  },

  /* --- Normal Consumer delivery: NO project/package/organization. --- */
  {
    id: 'del-004',
    deliveryNumber: 'DLV/2026/020088',
    orderId: 'ord-003',
    permit: {
      etpNumber: 'ETP/2026/MH/0436344',
      qrPayload: 'MHKNJ:ETP:2026:MH:0436344',
      issuedAt: hoursAgo(4),
      validUntil: hoursAgo(-20),
      sourceQuarryName: 'Godavari Sand Ghat',
      sourceStockPointId: 'sp-006',
      destinationLabel: 'Plot 14, Pathardi Phata, Nashik',
      destinationGeo: { latitude: 19.9975, longitude: 73.7898 },
      mineralId: 'min-sand',
      permittedQuantity: q(12),
      vehicleNumber: 'MH-15-BN-4402',
    },
    vehicle: {
      registrationNumber: 'MH-15-BN-4402',
      transporterName: 'Godavari Transport',
      driverName: 'Nitin Wagh',
      driverMobileNumber: '9689330214',
    },
    destination: {
      label: 'Plot 14, Pathardi Phata',
      address: {
        line1: 'Plot 14, Pathardi Phata',
        taluka: 'Nashik',
        district: 'Nashik',
        state: 'Maharashtra',
        pincode: '422010',
      },
      geo: { latitude: 19.9975, longitude: 73.7898 },
    },
    dispatchedQuantity: q(12),
    status: 'IN_TRANSIT',
    dispatchedAt: hoursAgo(3),
    expectedArrivalAt: hoursAgo(-1),
    tracking: [
      { at: hoursAgo(3), status: 'DISPATCHED', locationLabel: 'Nashik Road Stock Point', geo: { latitude: 19.949, longitude: 73.84 } },
      { at: hoursAgo(1), status: 'IN_TRANSIT', locationLabel: 'Dwarka Circle, Nashik', geo: { latitude: 19.9793, longitude: 73.8143 } },
    ],
  },
];
