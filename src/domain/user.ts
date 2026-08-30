import type { Address, GeoPoint, ID, ISODateTime } from './common';

/**
 * The single most important discriminator in the product.
 *
 * There is ONE application. This value determines navigation, available
 * features, visible fields, and which operational context is attached to
 * every mineral operation.
 */
export type UserType = 'NORMAL_CONSUMER' | 'ORGANIZATION';

interface BaseUser {
  id: ID;
  fullName: string;
  mobileNumber: string;
  email?: string;
  createdAt: ISODateTime;
}

/**
 * An individual buyer. Flat operational model — mineral belongs to the person,
 * not to a project or package.
 *
 * MUST NOT have: projects, packages, organization management,
 * supervisor workflows, site agent workflows, temporary excavation.
 */
export interface NormalConsumerUser extends BaseUser {
  userType: 'NORMAL_CONSUMER';
  /**
   * ASSUMPTION (open question #8): Normal Consumers need a delivery
   * destination equivalent to an Organization's package site, so that
   * receiving can verify the e-TP destination. Confirm the real concept.
   */
  deliveryAddress: Address;
  deliveryGeo: GeoPoint;
}

/**
 * A user acting on behalf of an Organization.
 *
 * ASSUMPTION (open question #9): one user per organization in V1.
 * Internal organization roles/permissions are not defined in the Project
 * Context and are deliberately not invented here.
 */
export interface OrganizationUser extends BaseUser {
  userType: 'ORGANIZATION';
  organizationId: ID;
  designation?: string;
}

export type User = NormalConsumerUser | OrganizationUser;

export function isOrganizationUser(user: User): user is OrganizationUser {
  return user.userType === 'ORGANIZATION';
}

export function isNormalConsumerUser(user: User): user is NormalConsumerUser {
  return user.userType === 'NORMAL_CONSUMER';
}
