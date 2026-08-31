import type {
  DemandNote,
  ID,
  Money,
  Payment,
  PaymentPurpose,
  TemporaryExcavationApplication,
} from '@/domain';
import { computeDemandNoteBreakdown, totalOf } from '@/rules';
import { request } from '../client';
import { db } from '../db';

export interface InitiatePaymentInput {
  applicationId: ID;
  purpose: PaymentPurpose;
}

export interface CompletePaymentInput {
  paymentId: ID;
  /** PROTOTYPE ONLY — a real gateway decides this, not the caller. */
  outcome: 'SUCCESS' | 'FAILED';
}

export interface CompletePaymentResult {
  payment: Payment;
  application: TemporaryExcavationApplication;
}

/**
 * PAYMENTS — and the status transitions they cause.
 *
 * This is the only place in the application workflow where the applicant
 * advances the status, and it happens as a CONSEQUENCE of payment rather than
 * as a separate action:
 *
 *   APPLICATION_FEE succeeds → DRAFT becomes SUBMITTED
 *   DEMAND_NOTE succeeds     → DEMAND_NOTE_ISSUED becomes ORDER_ISSUED,
 *                              and the excavation order is issued
 *
 * Modelled as initiate-then-complete because that is the shape of every real
 * gateway integration: the app creates an intent, hands off, and reconciles
 * whatever comes back. A prototype that just flipped a boolean would hide the
 * one part of this flow the production team actually has to build.
 */
export const paymentRepository = {
  /** Creates the payment intent handed to the gateway. */
  initiate: (input: InitiatePaymentInput): Promise<Payment> =>
    request(() => {
      const application = db.temporaryExcavationApplications.find(
        (candidate) => candidate.id === input.applicationId,
      );
      if (!application) throw new Error('Application not found');

      const amount = amountFor(application, input.purpose);
      if (!amount) throw new Error('Nothing is payable on this application');

      const payment: Payment = {
        id: `pay-${db.payments.length + 1}-${Date.now()}`,
        receiptNumber: `RCPT/2026/${String(db.payments.length + 96_001).padStart(7, '0')}`,
        applicationId: application.id,
        purpose: input.purpose,
        amount,
        status: 'INITIATED',
        initiatedAt: new Date().toISOString(),
      };

      db.payments.unshift(payment);
      return payment;
    }),

  /**
   * Reconciles the gateway result and applies its consequence.
   *
   * A failed payment changes nothing about the application — which is the
   * point of separating the two: an application must never be left in a state
   * that says it was paid for when it was not.
   */
  complete: (input: CompletePaymentInput): Promise<CompletePaymentResult> =>
    request(() => {
      const payment = db.payments.find((candidate) => candidate.id === input.paymentId);
      if (!payment) throw new Error('Payment not found');

      const application = db.temporaryExcavationApplications.find(
        (candidate) => candidate.id === payment.applicationId,
      );
      if (!application) throw new Error('Application not found');

      const now = new Date().toISOString();

      if (input.outcome === 'FAILED') {
        payment.status = 'FAILED';
        payment.failureReason = 'The payment was declined by the bank.';
        return { payment, application };
      }

      payment.status = 'SUCCESS';
      payment.completedAt = now;
      payment.gatewayReference = `MHKNJPG-${Math.floor(4_600_000 + Math.random() * 99_999)}`;
      payment.method = 'UPI';

      if (payment.purpose === 'APPLICATION_FEE') {
        /* Paying the fee IS submitting. There is no separate submit step. */
        application.status = 'SUBMITTED';
        application.submittedAt = now;
        application.statusUpdatedAt = now;
        application.applicationNumber = application.applicationNumber.replace('DRAFT-', '');
      } else {
        /* Paying the demand note is what produces the excavation order. */
        application.status = 'ORDER_ISSUED';
        application.statusUpdatedAt = now;
        application.excavationOrder = {
          orderNumber: `EXO/2026/${String(db.payments.length + 900).padStart(6, '0')}`,
          issuedAt: now,
          validFrom: application.fromDate,
          validUntil: application.toDate,
          permittedQuantity: application.estimatedQuantity,
        };
      }

      return { payment, application };
    }),

  listByApplication: (applicationId: ID): Promise<Payment[]> =>
    request(() =>
      db.payments
        .filter((payment) => payment.applicationId === applicationId)
        .sort((a, b) => b.initiatedAt.localeCompare(a.initiatedAt)),
    ),
};

function amountFor(
  application: TemporaryExcavationApplication,
  purpose: PaymentPurpose,
): Money | null {
  if (purpose === 'APPLICATION_FEE') return application.applicationFee;
  return application.demandNote?.totalAmount ?? null;
}

/**
 * Builds a demand note for an application.
 *
 * Exposed for the prototype's demo controls; in production the department
 * raises this and it arrives with the application.
 */
export function buildDemandNote(
  application: TemporaryExcavationApplication,
  demandNoteNumber: string,
  issuedAt: string,
  dueDate: string,
): DemandNote {
  const breakdown = computeDemandNoteBreakdown(application.estimatedQuantity);
  return { demandNoteNumber, issuedAt, dueDate, totalAmount: totalOf(breakdown), breakdown };
}
