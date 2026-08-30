import type { Organization, User } from '@/domain';
import { consumerUser, organizations, organizationUser } from '@/data/fixtures';

/**
 * ============================================================================
 * PROTOTYPE ONLY — NOT PART OF THE PRODUCT
 * ============================================================================
 *
 * Demo personas for reviewing both authenticated experiences without going
 * through authentication.
 *
 * Increment 1 introduces the real flow:
 *   Splash → Login/Register → Mobile Number → OTP → Authenticated Experience
 *
 * At that point this becomes a review shortcut rather than the entry point,
 * and it is deleted entirely before any production hand-off.
 *
 * TO REMOVE: delete src/prototype/, the <PrototypeBar /> line in AppShell,
 * the persona route in app/router.tsx, and the prototype block in MoreScreen.
 */
export interface Persona {
  id: string;
  label: string;
  description: string;
  user: User;
  organization: Organization | null;
}

export const PERSONAS: Persona[] = [
  {
    id: 'organization',
    label: 'Organization',
    description: 'Sanghavi Infrastructure — 3 projects, 5 packages, active deliveries.',
    user: organizationUser,
    organization: organizations[0] ?? null,
  },
  {
    id: 'consumer',
    label: 'Normal Consumer',
    description: 'Aniket Deshmukh, Nashik — individual buyer, no organization.',
    user: consumerUser,
    organization: null,
  },
];
