import type { Address, Contact, ID } from './common';

/**
 * PRODUCT RULE — organization type is METADATA ONLY.
 *
 * It may be displayed. It must NEVER branch navigation, screens, or flows.
 * There is exactly one Organization experience shared by all types.
 * Do not build a "Builder App", "Contractor App", or "Government App".
 */
export type OrganizationType = 'BUILDER' | 'CONTRACTOR' | 'GOVERNMENT' | 'OTHER';

export interface Organization {
  id: ID;
  name: string;
  type: OrganizationType;
  /** Mahakhanij master-entity registration reference. */
  registrationNumber: string;
  address: Address;
  primaryContact: Contact;
}
