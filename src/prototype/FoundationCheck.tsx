import { capabilitiesFor, usesOrganizationContext } from '@/rules';
import { ContextBar, Surface } from '@/design-system';
import { useCurrentUser, useOperatingContext } from '@/state';
import { copy } from '@/content';

/**
 * PROTOTYPE ONLY — a QA panel, not a product surface.
 *
 * Makes the invisible foundation inspectable so role-based access and context
 * preservation can be verified by looking rather than by reading code:
 *
 *   · which capabilities the signed-in user actually holds
 *   · what operating context is currently attached
 *   · whether an operation would be considered fully scoped
 *
 * Deleted along with the rest of src/prototype.
 */
export function FoundationCheck() {
  const user = useCurrentUser();
  const context = useOperatingContext();

  if (!user || !context) return null;

  const capabilities = capabilitiesFor(user.userType);
  const hasHierarchy = usesOrganizationContext(user.userType);

  return (
    <Surface variant="outlined" rounded className="mx-4 overflow-hidden">
      <div className="border-b border-line bg-neutral-50 px-4 py-2">
        <p className="text-overline text-ink-muted uppercase">Foundation check</p>
      </div>

      <dl className="divide-y divide-line">
        <Row label="User type" value={copy.userType[user.userType]} />
        <Row
          label="Capabilities"
          value={capabilities.length > 0 ? capabilities.join(', ') : 'None'}
        />

        {/*
          Organization → Project → Package rows are ABSENT for Normal
          Consumers rather than shown as empty. A consumer has no hierarchy, so
          "No project selected" would wrongly imply they could select one.
        */}
        {hasHierarchy && (
          <>
            <Row label="Organization" value={context.organizationName ?? '—'} />
            <Row label="Active project" value={context.projectName ?? copy.context.noProjectSelected} />
            <Row label="Active package" value={context.packageName ?? copy.context.noPackageSelected} />
          </>
        )}

        <Row label="Destination" value={context.destination?.label ?? '—'} />
        <Row label="Fully scoped" value={context.isScoped ? 'Yes' : 'No'} />
      </dl>

      {context.projectName && (
        <ContextBar primary={context.projectName} secondary={context.packageName} />
      )}
    </Surface>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5">
      <dt className="shrink-0 text-body-sm text-ink-secondary">{label}</dt>
      <dd className="min-w-0 text-right text-body-sm font-medium break-words text-ink">{value}</dd>
    </div>
  );
}
