import type { ID, ISODate, ISODateTime, Quantity } from './common';
import type { UserType } from './user';

/**
 * PROVISIONAL (open question #2 and #3) — the Project Context explicitly says
 * "do not invent unsupported approval stages or business statuses".
 *
 * This is the minimum viable lifecycle needed to connect Enquiry → Order.
 * It is deliberately shallow. Replace wholesale once the real vocabulary and
 * the real enquiry→order transition are confirmed.
 */
export type EnquiryStatus =
  | 'SUBMITTED'
  | 'ACKNOWLEDGED'
  | 'RESPONDED'
  | 'CONVERTED_TO_ORDER'
  | 'CLOSED';

/**
 * The consumer's stated mineral requirement against a chosen Stock Point.
 *
 * TERMINOLOGY RULE: this is an "Enquiry", never a "Booking" and never an
 * "Order placement". The interaction must not read as e-commerce checkout.
 *
 * CONTEXT RULE: organizationId / projectId / packageId are populated for
 * ORGANIZATION users and are ALWAYS absent for NORMAL_CONSUMER users. Normal
 * Consumers must never see these fields in the UI.
 */
export interface Enquiry {
  id: ID;
  enquiryNumber: string;
  raisedByUserId: ID;
  raisedByUserType: UserType;

  /* --- Organization context. Absent for Normal Consumers. --- */
  organizationId?: ID;
  projectId?: ID;
  packageId?: ID;

  stockPointId: ID;
  mineralId: ID;
  requiredQuantity: Quantity;
  requiredByDate?: ISODate;
  remarks?: string;

  status: EnquiryStatus;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;

  /** Set when the enquiry results in an order. See open question #3. */
  orderId?: ID;
}
