import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MinusCircle } from 'lucide-react';
import { computeAvailableQuantity, formatQuantity, formatQuantityValue } from '@/rules';
import {
  Button,
  EmptyState,
  ErrorState,
  ListGroup,
  ListRow,
  LoadingState,
  MetricTile,
  SectionHeader,
  Surface,
} from '@/design-system';
import { Screen } from '@/navigation';
import {
  consumptionRepository,
  inventoryRepository,
  mineralRepository,
  packageRepository,
  useAsync,
} from '@/data';
import { useCopy } from '@/content';
import { RecordConsumptionSheet } from './RecordConsumptionSheet';

/**
 * ONE MINERAL, IN ONE SCOPE.
 *
 * Available is the headline because it is the number that governs what can
 * happen next; received and consumed sit beneath it because they are what
 * explain it. The consumption history is the audit trail behind the consumed
 * figure — a total nobody can decompose is a total nobody trusts.
 */
export function InventoryBalanceScreen() {
  const { balanceId } = useParams<{ balanceId: string }>();
  const [sheetOpen, setSheetOpen] = useState(false);
  const t = useCopy();

  const query = useAsync(async () => {
    if (!balanceId) throw new Error('A balance is required');

    const balance = await inventoryRepository.getById(balanceId);
    if (!balance) throw new Error('Inventory balance not found');

    const [minerals, entries, activePackage] = await Promise.all([
      mineralRepository.listAll(),
      consumptionRepository.listByBalance(balance.id),
      balance.scope.kind === 'PACKAGE'
        ? packageRepository.getById(balance.scope.packageId)
        : Promise.resolve(null),
    ]);

    return { balance, minerals, entries, activePackage };
  }, [balanceId]);

  const balance = query.data?.balance;
  const mineral = query.data?.minerals.find(
    (candidate) => candidate.id === balance?.mineralId,
  );
  const available = balance ? computeAvailableQuantity(balance) : null;
  const depleted = available !== null && available.value <= 0;

  return (
    <Screen
      title={mineral?.name ?? t.inventory.balanceTitle}
      {...(query.data?.activePackage ? { subtitle: query.data.activePackage.name } : {})}
      onBack
      footer={
        balance && available && !depleted ? (
          <Button
            size="lg"
            fullWidth
            leftIcon={<MinusCircle size={16} />}
            onClick={() => setSheetOpen(true)}
          >
            {t.inventory.recordConsumption}
          </Button>
        ) : undefined
      }
    >
      {query.loading && <LoadingState variant="list" rows={4} />}
      {query.error && <ErrorState onRetry={query.reload} />}

      {query.data && balance && available && (
        <div className="pb-8">
          <Surface className="border-b border-line px-4 py-5">
            <p className="text-label text-ink-secondary">{t.inventory.available}</p>
            <p className="tabular mt-1 text-display text-ink">
              {formatQuantityValue(available)}{' '}
              <span className="text-title text-ink-muted">{available.unit}</span>
            </p>
            {depleted && (
              <p className="mt-2 text-body-sm text-ink-muted">{t.inventory.fullyConsumed}</p>
            )}

            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4">
              <MetricTile
                label={t.inventory.received}
                value={formatQuantityValue(balance.receivedQuantity)}
                unit={balance.receivedQuantity.unit}
              />
              <MetricTile
                label={t.inventory.consumed}
                value={formatQuantityValue(balance.consumedQuantity)}
                unit={balance.consumedQuantity.unit}
              />
            </div>
          </Surface>

          <SectionHeader title={t.inventory.history} />

          {query.data.entries.length === 0 ? (
            <Surface className="border-y border-line">
              <EmptyState
                className="py-8"
                icon={<MinusCircle size={22} />}
                title={t.inventory.noHistory}
                description={t.inventory.noHistoryBody}
              />
            </Surface>
          ) : (
            <ListGroup className="border-y border-line">
              {query.data.entries.map((entry) => (
                <ListRow
                  key={entry.id}
                  leading={<MinusCircle size={17} />}
                  leadingTone="neutral"
                  title={formatQuantity(entry.quantity)}
                  {...(entry.purpose ? { subtitle: entry.purpose } : {})}
                  detail={formatDateTime(entry.recordedAt)}
                  trailing={null}
                />
              ))}
            </ListGroup>
          )}
        </div>
      )}

      {balance && available && (
        <RecordConsumptionSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          balance={balance}
          available={available}
          onRecorded={query.reload}
        />
      )}
    </Screen>
  );
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
