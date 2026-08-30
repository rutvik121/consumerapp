import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, FileText, LogOut, Package as PackageIcon, RotateCcw, Shovel, Warehouse } from 'lucide-react';
import {
  Button,
  ConfirmDialog,
  ListGroup,
  ListRow,
  SectionHeader,
  StatusBadge,
} from '@/design-system';
import { ROUTES, Screen } from '@/navigation';
import { userCan } from '@/rules';
import { resetDatabase } from '@/data';
import { useCurrentOrganization, useCurrentUser, useOrganizationContextStore, useSessionStore } from '@/state';
import { copy } from '@/content';
import { FoundationCheck } from '@/prototype/FoundationCheck';

/**
 * The one route in Increment 0 that is genuinely functional, because sign-out
 * and account identity are needed to exercise everything else.
 *
 * It is also where role-based access is most visible: Temporary Excavation and
 * Organization appear here for an Organization user and are simply absent for a
 * Normal Consumer — driven by the same capability matrix as navigation and the
 * route guards, never by a second hand-written condition.
 */
export function MoreScreen() {
  const user = useCurrentUser();
  const organization = useCurrentOrganization();
  const signOut = useSessionStore((state) => state.signOut);
  const clearContext = useOrganizationContextStore((state) => state.clear);
  const navigate = useNavigate();

  const [confirmSignOut, setConfirmSignOut] = useState(false);

  if (!user) return null;

  const canSeeExcavation = userCan(user, 'TEMPORARY_EXCAVATION');
  const canSeeOrganization = userCan(user, 'VIEW_ORGANIZATION');

  function handleSignOut() {
    clearContext();
    signOut();
    navigate(ROUTES.welcome, { replace: true });
  }

  return (
    <Screen title={copy.nav.more}>
      {/* Account identity */}
      <div className="bg-surface px-4 py-5">
        <p className="text-title-lg text-ink">{user.fullName}</p>
        <p className="mt-0.5 text-body-sm text-ink-secondary tabular">{user.mobileNumber}</p>
        <div className="mt-3">
          <StatusBadge
            label={copy.userType[user.userType]}
            tone={user.userType === 'ORGANIZATION' ? 'info' : 'neutral'}
          />
        </div>
        {organization && (
          <p className="mt-3 text-body-sm text-ink-secondary">{organization.name}</p>
        )}
      </div>

      <SectionHeader title="Operations" />
      <ListGroup className="border-y border-line">
        <ListRow
          leading={<Warehouse size={17} />}
          title="Inventory"
          subtitle="Received, consumed and available quantity"
          meta={<StatusBadge label="Increment 6" tone="neutral" size="sm" />}
          disabled
          trailing={null}
        />
        <ListRow
          leading={<FileText size={17} />}
          title="Enquiries"
          subtitle="Mineral requirements you have raised"
          meta={<StatusBadge label="Increment 3" tone="neutral" size="sm" />}
          disabled
          trailing={null}
        />
        <ListRow
          leading={<PackageIcon size={17} />}
          title="Receive Mineral"
          subtitle="Verify and receive an arriving vehicle"
          meta={<StatusBadge label="Increment 5" tone="neutral" size="sm" />}
          disabled
          trailing={null}
        />
      </ListGroup>

      {/* ORGANIZATION ONLY — absent, not disabled, for Normal Consumers. */}
      {(canSeeExcavation || canSeeOrganization) && (
        <>
          <SectionHeader title="Organization" />
          <ListGroup className="border-y border-line">
            {canSeeOrganization && organization && (
              <ListRow
                leading={<Building2 size={17} />}
                title={organization.name}
                subtitle={`${copy.organizationType[organization.type]} · ${organization.registrationNumber}`}
                trailing={null}
              />
            )}
            {canSeeExcavation && (
              <ListRow
                leading={<Shovel size={17} />}
                title="Temporary Excavation"
                subtitle="Applications and status"
                onClick={() => navigate(ROUTES.temporaryExcavation)}
              />
            )}
          </ListGroup>
        </>
      )}

      {/* ==== PROTOTYPE ONLY — remove with src/prototype ==== */}
      <SectionHeader title={copy.prototype.demoSection} />
      <FoundationCheck />
      <div className="px-4 pt-4">
        <Button
          variant="secondary"
          fullWidth
          leftIcon={<RotateCcw size={15} />}
          onClick={() => resetDatabase()}
        >
          Reset demo data
        </Button>
      </div>
      {/* ==== end prototype block ==== */}

      <div className="px-4 py-4">
        <Button
          variant="secondary"
          fullWidth
          leftIcon={<LogOut size={15} />}
          onClick={() => setConfirmSignOut(true)}
        >
          {copy.actions.signOut}
        </Button>
      </div>

      <p className="px-4 pb-8 text-caption text-ink-muted">
        {copy.app.name} {copy.app.tagline} · Prototype v0.1
      </p>

      <ConfirmDialog
        open={confirmSignOut}
        title="Sign out?"
        description="You will return to the entry screen."
        confirmLabel={copy.actions.signOut}
        onConfirm={handleSignOut}
        onCancel={() => setConfirmSignOut(false)}
      />
    </Screen>
  );
}
