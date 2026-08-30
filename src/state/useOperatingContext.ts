import type { Destination, ID, UserType } from '@/domain';
import { usesOrganizationContext } from '@/rules';
import { useActivePackage, useActiveProject } from './organizationContextStore';
import { useCurrentOrganization, useCurrentUser } from './sessionStore';

/**
 * THE OBJECT THAT TRAVELS THROUGH EVERY OPERATIONAL FLOW.
 *
 *     Organization → Project → Package → Operation
 *
 * Rather than each screen reaching into two stores and re-deriving what it is
 * allowed to see, every flow takes this one resolved value. It answers, in one
 * place, the four questions the Project Context says to ask before building
 * any screen:
 *
 *   Who is the user?          → userType
 *   What context is known?    → organizationId / projectId / packageId
 *   Where is the mineral for? → destination
 *   Is the scope complete?    → isScoped
 *
 * `destination` is what makes discovery rank by real distance, and what
 * receiving verifies the e-TP destination against. It resolves to the Package
 * site for Organizations and to the registered delivery address for Normal
 * Consumers — one field, two sources, so downstream flows never branch on role.
 */
export interface OperatingContext {
  userId: ID;
  userType: UserType;

  /** Present only for ORGANIZATION users. Absent — not empty — for consumers. */
  organizationId?: ID;
  organizationName?: string;
  projectId?: ID;
  projectName?: string;
  packageId?: ID;
  packageName?: string;

  /** Null for an organization user who has not yet chosen a package. */
  destination: Destination | null;

  /**
   * True when an operation can proceed with full context.
   * Organizations require a package. Normal Consumers are always scoped.
   */
  isScoped: boolean;
}

export function useOperatingContext(): OperatingContext | null {
  const user = useCurrentUser();
  const organization = useCurrentOrganization();
  const project = useActiveProject();
  const activePackage = useActivePackage();

  if (!user) return null;

  if (!usesOrganizationContext(user.userType)) {
    // Normal Consumer: flat scope, destination is their registered address.
    const consumer = user.userType === 'NORMAL_CONSUMER' ? user : null;

    return {
      userId: user.id,
      userType: user.userType,
      destination: consumer
        ? {
            label: consumer.deliveryAddress.line1,
            address: consumer.deliveryAddress,
            geo: consumer.deliveryGeo,
          }
        : null,
      isScoped: true,
    };
  }

  return {
    userId: user.id,
    userType: user.userType,
    organizationId: organization?.id,
    organizationName: organization?.name,
    projectId: project?.id,
    projectName: project?.name,
    packageId: activePackage?.id,
    packageName: activePackage?.name,
    destination: activePackage
      ? {
          label: activePackage.name,
          address: activePackage.siteAddress,
          geo: activePackage.siteGeo,
        }
      : null,
    isScoped: Boolean(activePackage),
  };
}
