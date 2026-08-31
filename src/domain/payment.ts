import type { ID, ISODateTime, Money } from './common';

/**
 * PAYMENTS.
 *
 * The Temporary Excavation workflow is paid twice, and the two payments gate
 * different things:
 *
 *   APPLICATION_FEE  paid BEFORE submission. The application is submitted
 *                    automatically the moment it succeeds — there is no
 *                    separate submit step behind it.
 *   DEMAND_NOTE      paid AFTER the department raises a demand note. The
 *                    excavation order is issued once it succeeds.
 *
 * Nothing else in the app is paid for. Mineral itself is never priced here.
 */
export type PaymentPurpose = 'APPLICATION_FEE' | 'DEMAND_NOTE';

export type PaymentStatus = 'INITIATED' | 'SUCCESS' | 'FAILED';

/**
 * PROVISIONAL: real integration is with the Mahakhanij payment gateway. The
 * prototype simulates the redirect and the result, but models the record a
 * real gateway would return so the receipt is a genuine artefact.
 */
export interface Payment {
  id: ID;
  receiptNumber: string;
  applicationId: ID;
  purpose: PaymentPurpose;
  amount: Money;
  status: PaymentStatus;
  initiatedAt: ISODateTime;
  completedAt?: ISODateTime;
  /** What the gateway reported back. Shown on the receipt. */
  gatewayReference?: string;
  method?: string;
  /** Present when the payment failed, in the payer's language. */
  failureReason?: string;
}
