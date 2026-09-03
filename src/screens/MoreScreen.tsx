import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Building2,
  ChevronRight,
  FileText,
  LogOut,
  Package as PackageIcon,
  RotateCcw,
  ShieldCheck,
  Shovel,
  UserCheck,
  Warehouse,
} from 'lucide-react';
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
import { packageRepository, resetDatabase, useAsync } from '@/data';
import { useCurrentOrganization, useCurrentUser, useOrganizationContextStore, useSessionStore } from '@/state';
import { copy } from '@/content';
import { FoundationCheck } from '@/prototype/FoundationCheck';

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
  const supervisors = useAsync(() => packageRepository.listSupervisors(), []);

  function handleSignOut() {
    clearContext();
    signOut();
    navigate(ROUTES.welcome, { replace: true });
  }

  return (
    <Screen title={copy.nav.more}>
      {/* Account identity Header Card - Clickable to open Profile */}
      <button
        type="button"
        onClick={() => navigate(ROUTES.profile)}
        className="w-full text-left bg-surface px-4 py-4 border-b border-line hover:bg-neutral-50 active:bg-neutral-100 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-title font-bold text-ink group-hover:text-primary-700 transition-colors">
              {user.fullName}
            </h2>
            <StatusBadge
              label={copy.userType[user.userType]}
              tone={user.userType === 'ORGANIZATION' ? 'info' : 'neutral'}
            />
          </div>
          <p className="mt-0.5 text-body-sm text-ink-secondary tabular">{user.mobileNumber}</p>
          {organization && (
            <div className="mt-2 pt-2 border-t border-line text-caption text-ink-secondary">
              <p className="font-semibold text-ink">{organization.name}</p>
              <p className="text-neutral-500 font-mono">
                {copy.organizationType[organization.type]} · {organization.registrationNumber}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-caption font-semibold text-primary-700 bg-primary-50 px-2.5 py-1.5 rounded-xl border border-primary-100">
          <span>Edit & KYC</span>
          <ChevronRight size={14} />
        </div>
      </button>

      <SectionHeader title="Account & Identity" />
      <ListGroup className="border-y border-line">
        <ListRow
          leading={<ShieldCheck size={18} className="text-emerald-700" />}
          title="My Profile & KYC Verification"
          subtitle="Update personal info, address, company registration and KYC"
          onClick={() => navigate(ROUTES.profile)}
          trailing={null}
        />
      </ListGroup>

      {/* ORGANIZATION MANAGEMENT ON TOP (For Organization users) */}
      {(canSeeExcavation || canSeeOrganization) && (
        <>
          <SectionHeader title="Organization Management" />
          <ListGroup className="border-y border-line">
            {canSeeOrganization && (
              <ListRow
                leading={<UserCheck size={17} />}
                title="Supervisors"
                subtitle={`${supervisors.data?.length ?? 6} registered supervisors`}
                onClick={() => navigate(ROUTES.supervisors)}
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

      <SectionHeader title="Operations" />
      <ListGroup className="border-y border-line">
        <ListRow
          leading={<Warehouse size={17} />}
          title="Inventory"
          subtitle="Received, consumed and available quantity"
          onClick={() => navigate(ROUTES.inventory)}
          trailing={null}
        />
        {user.userType === 'NORMAL_CONSUMER' && (
          <ListRow
            leading={<Building2 size={17} />}
            title="Projects"
            subtitle="Create and manage your registered sites"
            onClick={() => navigate(ROUTES.consumerProjects)}
            trailing={null}
          />
        )}
        <ListRow
          leading={<FileText size={17} />}
          title="Enquiries"
          subtitle="Mineral requirements you have raised"
          onClick={() => navigate(ROUTES.enquiries)}
          trailing={null}
        />
        <ListRow
          leading={<PackageIcon size={17} />}
          title="Receive Mineral"
          subtitle="Verify and receive an arriving vehicle"
          onClick={() => navigate(ROUTES.receive)}
          trailing={null}
        />
        {user.userType === 'ORGANIZATION' && (
          <ListRow
            leading={<BarChart3 size={17} />}
            title="Reports & Statements"
            subtitle="DigiTP transit pass logs, tax summaries and material receipts"
            onClick={() => navigate(ROUTES.reports)}
            trailing={null}
          />
        )}
        {user.userType === 'NORMAL_CONSUMER' && (
          <ListRow
            leading={<Building2 size={17} />}
            title="Minerals"
            subtitle="Explore mineral availability and nearby stock points"
            onClick={() => navigate(ROUTES.mineral)}
            trailing={null}
          />
        )}
      </ListGroup>

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
