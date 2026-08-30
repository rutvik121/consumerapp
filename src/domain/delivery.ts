import type { Destination, GeoPoint, ID, ISODateTime, Quantity } from './common';

/** PROVISIONAL (open question #2). */
export type DeliveryStatus =
  | 'SCHEDULED'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'ARRIVED_AT_DESTINATION'
  | 'RECEIVED'
  | 'RECEIVED_WITH_DISCREPANCY';

/**
 * Electronic Transport Permit (e-TP) — the backbone of Mahakhanij traceability.
 *
 * Issued by the wider ecosystem, NOT by this app. The Consumer App only reads
 * and verifies it. Carries a unique QR code as a security feature, which is
 * exactly what the receiving flow scans.
 *
 * This is why a delivery in this app is never a generic shipment: it is a
 * permit-backed transaction with known source, destination, vehicle, mineral
 * and permitted quantity.
 */
export interface TransportPermit {
  etpNumber: string;
  /** Payload encoded in the permit's QR code. Matched during verification. */
  qrPayload: string;
  issuedAt: ISODateTime;
  validUntil: ISODateTime;

  sourceQuarryName: string;
  sourceStockPointId: ID;

  /** Where the mineral is legally permitted to be offloaded. */
  destinationLabel: string;
  destinationGeo: GeoPoint;

  mineralId: ID;
  permittedQuantity: Quantity;
  vehicleNumber: string;
}

export interface Vehicle {
  registrationNumber: string;
  transporterName: string;
  driverName: string;
  driverMobileNumber: string;
}

/** One point on the source-to-destination movement record. */
export interface TrackingUpdate {
  at: ISODateTime;
  status: DeliveryStatus;
  locationLabel: string;
  geo?: GeoPoint;
  note?: string;
}

/**
 * The four checks performed during receiving, before any quantity is entered.
 * QR scanning is ONE verification step — not the whole receiving experience.
 */
export interface ReceiptVerification {
  qrScanned: boolean;
  permitValid: boolean;
  vehicleMatched: boolean;
  destinationMatched: boolean;
}

/**
 * PROVISIONAL (open question #6) — whether a shortfall requires a categorised
 * reason, and whether it raises anything downstream, is not yet defined.
 */
export type DiscrepancyReason =
  | 'TRANSIT_LOSS'
  | 'MEASUREMENT_DIFFERENCE'
  | 'PARTIAL_OFFLOAD'
  | 'OTHER';

/**
 * The destination-side record of what actually arrived.
 *
 * `differenceQuantity` is derived (dispatched − received) but stored so the
 * receipt remains an immutable audit record of what was asserted at the time.
 */
export interface DeliveryReceipt {
  receivedAt: ISODateTime;
  receivedByUserId: ID;
  verification: ReceiptVerification;
  dispatchedQuantity: Quantity;
  receivedQuantity: Quantity;
  differenceQuantity: Quantity;
  hasDiscrepancy: boolean;
  discrepancyReason?: DiscrepancyReason;
  remarks?: string;
}

/**
 * One physical mineral movement under one e-TP.
 *
 * CONTEXT RULE: organization context is present for ORGANIZATION users only.
 */
export interface Delivery {
  id: ID;
  deliveryNumber: string;
  orderId: ID;

  /* --- Organization context. Absent for Normal Consumers. --- */
  organizationId?: ID;
  projectId?: ID;
  packageId?: ID;

  permit: TransportPermit;
  vehicle: Vehicle;
  destination: Destination;

  /** What the source says it sent. Compared against actual receipt. */
  dispatchedQuantity: Quantity;

  status: DeliveryStatus;
  dispatchedAt?: ISODateTime;
  expectedArrivalAt?: ISODateTime;
  arrivedAt?: ISODateTime;

  /** Ordered oldest-first. Powers the tracking timeline. */
  tracking: TrackingUpdate[];

  /** Present once receiving is confirmed. */
  receipt?: DeliveryReceipt;
}
