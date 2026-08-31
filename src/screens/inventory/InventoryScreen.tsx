import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Warehouse } from 'lucide-react';
import type { ID, InventoryBalance } from '@/domain';
import {
  computeAvailableQuantity,
  formatQuantity,
  formatQuantityValue,
  summarizeInventory,
  usesOrganizationContext,
} from '@/rules';
import {
  Chip,
  EmptyState,
  ErrorState,
  ListGroup,
  ListRow,
  LoadingState,
  MetricTile,
  SectionHeader,
  Surface,
} from '@/design-system';
import { OrganizationContextBar, ROUTES, Screen } from '@/navigation';
import { inventoryRepository, mineralRepository, packageRepository, useAsync } from '@/data';
import { useCurrentUser, useOperatingContext } from '@/state';
import { useCopy } from '@/content';

/**
 * INVENTORY — the simplest mental model in the product, kept simple.
 *
 *     Received − Consumed = Available
 *
 * Three numbers, always shown together. Available on its own invites the
 * question "out of how much?", and the answer is what tells a site manager
 * whether they are running a package efficiently or bleeding mineral.
 *
 * SCOPE: an Organization operating inside a package sees that package by
 * default, with one tap to widen to the whole organization — the context they
 * chose is honoured, not overridden, and not permanent. A Normal Consumer has
 * no hierarchy, so the switcher does not exist for them.
 */
export function InventoryScreen() {
  const user = useCurrentUser();
  const context = useOperatingContext();
  const navigate = useNavigate();
  const t = useCopy();

  const isOrganization = user ? usesOrganizationContext(user.userType) : false;
  const hasPackage = Boolean(context?.packageId);
  const [scopeToPackage, setScopeToPackage] = useState(true);
  const packageScoped = isOrganization && hasPackage && scopeToPackage;

  const query = useAsync(async () => {
    if (!user) throw new Error('A session is required');

    const balances = isOrganization
      ? await inventoryRepository.list(
          packageScoped
            ? { packageId: context?.packageId as ID }
            : { ...(context?.organizationId ? { organizationId: context.organizationId } : {}) },
        )
      : await inventoryRepository.list({ userId: user.id });

    const [minerals, packages] = await Promise.all([
      mineralRepository.listAll(),
      isOrganization && context?.organizationId
        ? packageRepository.listByOrganization(context.organizationId)
        : Promise.resolve([]),
    ]);

    return { balances, minerals, packages };
  }, [user?.id, context?.organizationId, context?.packageId, packageScoped]);

  const balances = query.data?.balances ?? [];
  const summary = balances.length > 0 ? summarizeInventory(balances) : null;

  const mineralName = (id: ID) =>
    query.data?.minerals.find((mineral) => mineral.id === id)?.name ?? 'Mineral';
  const packageName = (balance: InventoryBalance) => {
    // The scope union must be narrowed before its package fields exist.
    const scope = balance.scope;
    if (scope.kind !== 'PACKAGE') return undefined;
    return query.data?.packages.find((pkg) => pkg.id === scope.packageId)?.name;
  };

  return (
    <Screen
      title={t.inventory.title}
      onBack
      context={packageScoped ? <OrganizationContextBar showChange={false} /> : undefined}
    >
      {query.loading && <LoadingState variant="list" rows={4} />}
      {query.error && <ErrorState onRetry={query.reload} />}

      {query.data && (
        <div className="pb-8">
          {/* Scope switcher — only where a hierarchy exists to scope by. */}
          {isOrganization && hasPackage && (
            <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-line bg-surface px-4 py-3">
              <Chip
                label={t.inventory.thisPackage}
                active={scopeToPackage}
                onClick={() => setScopeToPackage(true)}
              />
              <Chip
                label={t.inventory.allPackages}
                active={!scopeToPackage}
                onClick={() => setScopeToPackage(false)}
              />
            </div>
          )}

          {balances.length === 0 ? (
            <EmptyState
              icon={<Warehouse size={22} />}
              title={packageScoped ? t.inventory.noStockInScope : t.inventory.noStock}
              description={
                packageScoped ? t.inventory.noStockInScopeBody : t.inventory.noStockBody
              }
            />
          ) : (
            <>
              {/* The whole model, in three numbers. */}
              {summary && (
                <Surface className="border-b border-line px-4 py-4">
                  <div className="grid grid-cols-3 gap-4">
                    <MetricTile
                      label={t.inventory.received}
                      value={formatQuantityValue(summary.received)}
                      unit={summary.received.unit}
                    />
                    <MetricTile
                      label={t.inventory.consumed}
                      value={formatQuantityValue(summary.consumed)}
                      unit={summary.consumed.unit}
                    />
                    <MetricTile
                      label={t.inventory.available}
                      value={formatQuantityValue(summary.available)}
                      unit={summary.available.unit}
                      tone="success"
                    />
                  </div>
                </Surface>
              )}

              <SectionHeader title="By mineral" />
              <ListGroup className="border-y border-line">
                {balances.map((balance) => {
                  const available = computeAvailableQuantity(balance);
                  const depleted = available.value <= 0;

                  return (
                    <ListRow
                      key={balance.id}
                      leading={<Warehouse size={17} />}
                      leadingTone={depleted ? 'neutral' : 'primary'}
                      title={mineralName(balance.mineralId)}
                      {...(packageScoped ? {} : { subtitle: packageName(balance) })}
                      detail={`${t.inventory.received} ${formatQuantity(balance.receivedQuantity)} · ${t.inventory.consumed} ${formatQuantity(balance.consumedQuantity)}`}
                      meta={
                        <span
                          className={`tabular text-title ${depleted ? 'text-ink-muted' : 'text-ink'}`}
                        >
                          {formatQuantity(available)}
                        </span>
                      }
                      onClick={() => navigate(ROUTES.inventoryBalance(balance.id))}
                    />
                  );
                })}
              </ListGroup>
            </>
          )}
        </div>
      )}
    </Screen>
  );
}
