import type { User, UserType } from '@/domain';

/**
 * ROLE-BASED ACCESS — the single source of truth.
 *
 * Navigation, route guards, and screens ALL read from this matrix. There must
 * be no second place where a role rule is written down, or the two will drift.
 *
 * FOR THE FUTURE FLUTTER TEAM: this table is the complete permission spec.
 * See docs/role-permissions.md for the rendered version.
 */
export type Capability =
  /** Access the Organization → Project → Package hierarchy. */
  | 'VIEW_PROJECTS'
  | 'VIEW_PACKAGES'
  /** Attach Project/Package context to mineral operations. */
  | 'USE_ORGANIZATION_CONTEXT'
  /** ORGANIZATION-ONLY compliance workflow. */
  | 'TEMPORARY_EXCAVATION'
  /** The Normal Consumer's dedicated Mineral tab. */
  | 'VIEW_MINERAL_TAB'
  /** Organization profile / details. */
  | 'VIEW_ORGANIZATION';

const CAPABILITIES_BY_USER_TYPE: Record<UserType, readonly Capability[]> = {
  ORGANIZATION: [
    'VIEW_PROJECTS',
    'VIEW_PACKAGES',
    'USE_ORGANIZATION_CONTEXT',
    'TEMPORARY_EXCAVATION',
    'VIEW_ORGANIZATION',
  ],

  /**
   * PRODUCT RULE — Normal Consumers must NOT have:
   *   Projects · Packages · Organization management ·
   *   Supervisor workflows · Site Agent workflows · Temporary Excavation
   *
   * The absence of TEMPORARY_EXCAVATION here is what makes the feature
   * invisible in navigation AND unreachable by direct URL.
   */
  NORMAL_CONSUMER: ['VIEW_MINERAL_TAB'],
};

/** Does this user type hold this capability? */
export function can(userType: UserType, capability: Capability): boolean {
  return CAPABILITIES_BY_USER_TYPE[userType].includes(capability);
}

/** Convenience overload for a resolved user. */
export function userCan(user: User | null, capability: Capability): boolean {
  if (!user) return false;
  return can(user.userType, capability);
}

export function capabilitiesFor(userType: UserType): readonly Capability[] {
  return CAPABILITIES_BY_USER_TYPE[userType];
}

/**
 * Does this user type operate inside the Organization → Project → Package
 * hierarchy? Used to decide whether operating context must be attached to an
 * operation, and whether Project/Package fields render at all.
 */
export function usesOrganizationContext(userType: UserType): boolean {
  return can(userType, 'USE_ORGANIZATION_CONTEXT');
}
