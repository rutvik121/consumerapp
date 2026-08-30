import type { Organization } from '@/domain';

/**
 * A single organization in V1 (assumption #8: one user per organization).
 *
 * NOTE the `type: 'BUILDER'` field: it is displayed as metadata and must never
 * branch any flow. Switching this to CONTRACTOR or GOVERNMENT must change
 * nothing except the label shown to the user.
 */
export const organizations: Organization[] = [
  {
    id: 'org-001',
    name: 'Sanghavi Infrastructure Pvt. Ltd.',
    type: 'BUILDER',
    registrationNumber: 'MH/MK/ENT/2023/018842',
    address: {
      line1: '4th Floor, Sanghavi House, LBS Marg',
      taluka: 'Kurla',
      district: 'Mumbai Suburban',
      state: 'Maharashtra',
      pincode: '400070',
    },
    primaryContact: { name: 'Rohit Sanghavi', mobileNumber: '9822014576' },
  },
];
