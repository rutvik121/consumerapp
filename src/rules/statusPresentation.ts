import type {
  DeliveryStatus,
  DispatchStatus,
  EnquiryStatus,
  PackageStatus,
  ProjectStatus,
  ReceivingStatus,
  StockPointStatus,
  TemporaryExcavationStatus,
} from '@/domain';

/**
 * STATUS → VISUAL TONE mapping.
 *
 * Lives in the rules layer, not in components, so that every status anywhere in
 * the app is coloured identically. Components receive a `tone`, never a raw
 * status string.
 *
 * Tone meanings (see design tokens):
 *   neutral  → inert / not yet started / closed
 *   info     → in progress, nothing required from the user
 *   success  → verified, complete, healthy
 *   warning  → needs the user's attention
 *   danger   → failed, rejected, critical
 */
export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface StatusPresentation {
  label: string;
  tone: StatusTone;
}

const ENQUIRY: Record<EnquiryStatus, StatusPresentation> = {
  SUBMITTED: { label: 'Submitted', tone: 'info' },
  ACKNOWLEDGED: { label: 'Acknowledged', tone: 'info' },
  RESPONDED: { label: 'Responded', tone: 'warning' },
  CONVERTED_TO_ORDER: { label: 'Ordered', tone: 'success' },
  CLOSED: { label: 'Closed', tone: 'neutral' },
};

const DISPATCH: Record<DispatchStatus, StatusPresentation> = {
  PENDING_DISPATCH: { label: 'Pending dispatch', tone: 'neutral' },
  PARTIALLY_DISPATCHED: { label: 'Partly dispatched', tone: 'info' },
  DISPATCHED: { label: 'Dispatched', tone: 'info' },
  COMPLETED: { label: 'Completed', tone: 'success' },
};

const RECEIVING: Record<ReceivingStatus, StatusPresentation> = {
  NOT_STARTED: { label: 'Not started', tone: 'neutral' },
  AWAITING_RECEIPT: { label: 'Awaiting receipt', tone: 'warning' },
  PARTIALLY_RECEIVED: { label: 'Partly received', tone: 'info' },
  RECEIVED: { label: 'Received', tone: 'success' },
  RECEIVED_WITH_DISCREPANCY: { label: 'Discrepancy', tone: 'danger' },
};

const DELIVERY: Record<DeliveryStatus, StatusPresentation> = {
  SCHEDULED: { label: 'Scheduled', tone: 'neutral' },
  DISPATCHED: { label: 'Dispatched', tone: 'info' },
  IN_TRANSIT: { label: 'In transit', tone: 'info' },
  ARRIVED_AT_DESTINATION: { label: 'Arrived', tone: 'warning' },
  RECEIVED: { label: 'Received', tone: 'success' },
  RECEIVED_WITH_DISCREPANCY: { label: 'Discrepancy', tone: 'danger' },
};

const PROJECT: Record<ProjectStatus, StatusPresentation> = {
  ACTIVE: { label: 'Active', tone: 'success' },
  ON_HOLD: { label: 'On hold', tone: 'warning' },
  COMPLETED: { label: 'Completed', tone: 'neutral' },
};

const PACKAGE: Record<PackageStatus, StatusPresentation> = {
  ACTIVE: { label: 'Active', tone: 'success' },
  ON_HOLD: { label: 'On hold', tone: 'warning' },
  COMPLETED: { label: 'Completed', tone: 'neutral' },
};

const STOCK_POINT: Record<StockPointStatus, StatusPresentation> = {
  OPERATIONAL: { label: 'Operational', tone: 'success' },
  LIMITED_STOCK: { label: 'Limited stock', tone: 'warning' },
  CLOSED: { label: 'Closed', tone: 'neutral' },
};

const TEMPORARY_EXCAVATION: Record<TemporaryExcavationStatus, StatusPresentation> = {
  DRAFT: { label: 'Draft', tone: 'neutral' },
  SUBMITTED: { label: 'Submitted', tone: 'info' },
  UNDER_REVIEW: { label: 'Under review', tone: 'info' },
  QUERY_RAISED: { label: 'Query raised', tone: 'warning' },
  APPROVED: { label: 'Approved', tone: 'success' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
};

export const statusPresentation = {
  enquiry: (s: EnquiryStatus) => ENQUIRY[s],
  dispatch: (s: DispatchStatus) => DISPATCH[s],
  receiving: (s: ReceivingStatus) => RECEIVING[s],
  delivery: (s: DeliveryStatus) => DELIVERY[s],
  project: (s: ProjectStatus) => PROJECT[s],
  package: (s: PackageStatus) => PACKAGE[s],
  stockPoint: (s: StockPointStatus) => STOCK_POINT[s],
  temporaryExcavation: (s: TemporaryExcavationStatus) => TEMPORARY_EXCAVATION[s],
} as const;
