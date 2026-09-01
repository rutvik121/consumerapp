import type { ID, ISODateTime, Quantity } from './common';
import type { UserType } from './user';

/** PROVISIONAL (open question #2). Tracks the SOURCE side of the transaction. */
export type DispatchStatus =
  | 'PENDING_DISPATCH'
  | 'PARTIALLY_DISPATCHED'
  | 'DISPATCHED'
  | 'DIGITP_CREATED'
  | 'COMPLETED';

/** PROVISIONAL (open question #2). Tracks the DESTINATION side. */
export type ReceivingStatus =
  | 'NOT_STARTED'
  | 'AWAITING_RECEIPT'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'RECEIVED_WITH_DISCREPANCY';

/**
 * A confirmed mineral requirement being fulfilled from a Stock Point.
 *
 * An Order is the commercial/operational envelope. The physical movement
 * happens in one or more Deliveries, each carrying its own e-TP. This is why
 * dispatch and receiving status are tracked separately — an order can be
 * partially dispatched and partially received.
 */
export interface Order {
  id: ID;
  orderNumber: string;
  digiTpNumber?: string;
  /** Every order traces back to the enquiry that produced it. */
  enquiryId: ID;
  placedByUserId: ID;
  placedByUserType: UserType;

  /* --- Organization context. Absent for Normal Consumers. --- */
  organizationId?: ID;
  projectId?: ID;
  packageId?: ID;

  stockPointId: ID;
  mineralId: ID;
  orderedQuantity: Quantity;

  dispatchStatus: DispatchStatus;
  receivingStatus: ReceivingStatus;

  /** Physical movements fulfilling this order. */
  deliveryIds: ID[];

  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
