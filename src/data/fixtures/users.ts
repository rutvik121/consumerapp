import type { NormalConsumerUser, OrganizationUser, User } from '@/domain';
import { daysAgo } from './_helpers';

/**
 * The two demo personas.
 *
 * Increment 1 replaces persona selection with real OTP authentication, but
 * these records remain as the seeded accounts behind it.
 */

export const ORGANIZATION_USER_ID = 'user-org-001';
export const CONSUMER_USER_ID = 'user-con-001';

export const organizationUser: OrganizationUser = {
  id: ORGANIZATION_USER_ID,
  userType: 'ORGANIZATION',
  fullName: 'Rohit Sanghavi',
  mobileNumber: '9822014576',
  email: 'rohit.s@sanghaviinfra.in',
  organizationId: 'org-001',
  designation: 'Project Procurement Lead',
  createdAt: daysAgo(420),
};

export const consumerUser: NormalConsumerUser = {
  id: CONSUMER_USER_ID,
  userType: 'NORMAL_CONSUMER',
  fullName: 'Aniket Deshmukh',
  mobileNumber: '9730845120',
  createdAt: daysAgo(96),
  deliveryAddress: {
    line1: 'Plot 14, Pathardi Phata',
    taluka: 'Nashik',
    district: 'Nashik',
    state: 'Maharashtra',
    pincode: '422010',
  },
  deliveryGeo: { latitude: 19.9975, longitude: 73.7898 },
};

export const users: User[] = [organizationUser, consumerUser];
