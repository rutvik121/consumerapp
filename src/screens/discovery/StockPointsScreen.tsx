import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, Map as MapIcon, SlidersHorizontal, Warehouse } from 'lucide-react';
import type { ID, StockPointSearchResult } from '@/domain';
import { formatQuantity, statusPresentation } from '@/rules';
import {
  BottomSheet,
  Button,
  Chip,
  EmptyState,
  ErrorState,
  ListGroup,
  ListRow,
  LoadingState,
  SearchInput,
  Select,
  StatusBadge,
  Surface,
  cn,
} from '@/design-system';
import { OrganizationContextBar, ROUTES, Screen } from '@/navigation';
import { mineralRepository, stockPointRepository, useAsync } from '@/data';
import { useOperatingContext } from '@/state';
import { useCopy } from '@/content';
import { StockPointMap } from './StockPointMap';

type ViewMode = 'list' | 'map';

const DISTANCE_OPTIONS = [
  { value: '', label: 'Any distance' },
  { value: '25', label: 'Within 25 km' },
  { value: '50', label: 'Within 50 km' },
  { value: '100', label: 'Within 100 km' },
];

/**
 * FIND STOCK POINT — the start of every acquisition.
 *
 *     Find Stock Point → Stock Point Details → Mineral Enquiry
 *
 * Built ONCE for both roles. What differs is only where distance is measured
 * from: an Organization's active package site, or a Normal Consumer's
 * registered delivery address. Both arrive as `context.destination`, so
 * nothing here branches on user type.
 *
 * An Organization that has not yet chosen a package has no destination to
 * measure from. Rather than silently ranking against nothing, the screen says
 * so and offers the way forward — which is also the one place it is legitimate
 * to ask for context, because there genuinely is none yet.
 */
export function StockPointsScreen() {
  const context = useOperatingContext();
  const navigate = useNavigate();
  const t = useCopy();

  const [search, setSearch] = useState('');
  const [mineralId, setMineralId] = useState<ID | ''>('');
  const [maxDistance, setMaxDistance] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [view, setView] = useState<ViewMode>('list');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedOnMap, setSelectedOnMap] = useState<ID | null>(null);

  const destination = context?.destination ?? null;

  const minerals = useAsync(() => mineralRepository.listAll(), []);

  const results = useAsync(
    () =>
      stockPointRepository.search({
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(mineralId ? { mineralId } : {}),
        ...(destination ? { near: destination.geo } : {}),
        ...(maxDistance ? { maxDistanceKm: Number(maxDistance) } : {}),
        ...(inStockOnly ? { availableOnly: true } : {}),
      }),
    [search, mineralId, maxDistance, inStockOnly, destination?.geo.latitude],
  );

  const activeFilters =
    (mineralId ? 1 : 0) + (maxDistance ? 1 : 0) + (inStockOnly ? 1 : 0);

  const mineralName = (id: ID) =>
    minerals.data?.find((mineral) => mineral.id === id)?.name ?? 'Mineral';

  /* Organization without a package: no destination, so no meaningful ranking. */
  if (context && !destination) {
    return (
      <Screen title={t.discovery.title} onBack>
        <EmptyState
          icon={<Warehouse size={22} />}
          title={t.discovery.noDestination}
          description={t.discovery.noDestinationBody}
          action={
            <Button onClick={() => navigate(ROUTES.projects)}>{t.discovery.chooseProject}</Button>
          }
        />
      </Screen>
    );
  }

  return (
    <Screen
      title={t.discovery.title}
      onBack
      context={<OrganizationContextBar showChange={false} />}
    >
      <Surface className="sticky top-0 z-20 border-b border-line px-4 py-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t.discovery.searchPlaceholder}
        />

        <div className="mt-3 flex items-center gap-2">
          <Button
            size="sm"
            variant={activeFilters > 0 ? 'subtle' : 'secondary'}
            leftIcon={<SlidersHorizontal size={14} />}
            onClick={() => setFiltersOpen(true)}
          >
            {activeFilters > 0 ? `${t.discovery.filters} · ${activeFilters}` : t.discovery.filters}
          </Button>

          <div className="ml-auto flex rounded-md border border-line-strong p-0.5">
            <ViewToggle active={view === 'list'} onClick={() => setView('list')} label={t.discovery.listView} icon={<List size={14} />} />
            <ViewToggle active={view === 'map'} onClick={() => setView('map')} label={t.discovery.mapView} icon={<MapIcon size={14} />} />
          </div>
        </div>

        {activeFilters > 0 && (
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {mineralId && (
              <Chip active label={mineralName(mineralId)} onRemove={() => setMineralId('')} />
            )}
            {maxDistance && (
              <Chip
                active
                label={`Within ${maxDistance} km`}
                onRemove={() => setMaxDistance('')}
              />
            )}
            {inStockOnly && (
              <Chip active label={t.discovery.inStockOnly} onRemove={() => setInStockOnly(false)} />
            )}
          </div>
        )}
      </Surface>

      {results.loading && <LoadingState variant="list" rows={4} />}
      {results.error && <ErrorState onRetry={results.reload} />}

      {results.data && results.data.length === 0 && (
        <EmptyState
          icon={<Warehouse size={22} />}
          title={t.discovery.noResults}
          description={t.discovery.noResultsBody}
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setMineralId('');
                setMaxDistance('');
                setInStockOnly(false);
                setSearch('');
              }}
            >
              {t.discovery.clearAll}
            </Button>
          }
        />
      )}

      {results.data && results.data.length > 0 && (
        <>
          {view === 'map' && destination && (
            <div className="border-b border-line">
              <StockPointMap
                origin={destination.geo}
                originLabel={destination.label}
                results={results.data}
                selectedId={selectedOnMap}
                onSelect={setSelectedOnMap}
              />
            </div>
          )}

          <p className="px-4 pt-4 pb-2 text-overline text-ink-muted uppercase">
            {t.discovery.resultCount(results.data.length)}
          </p>

          <ListGroup className="border-y border-line">
            {results.data.map((result, index) => (
              <StockPointRow
                key={result.stockPoint.id}
                result={result}
                index={index + 1}
                showIndex={view === 'map'}
                hasDestination={Boolean(destination)}
                mineralName={mineralName}
                highlighted={result.stockPoint.id === selectedOnMap}
                onOpen={() => navigate(ROUTES.stockPointDetails(result.stockPoint.id))}
              />
            ))}
          </ListGroup>
        </>
      )}

      <BottomSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title={t.discovery.filters}
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setMineralId('');
                setMaxDistance('');
                setInStockOnly(false);
              }}
            >
              {t.discovery.clearAll}
            </Button>
            <Button fullWidth onClick={() => setFiltersOpen(false)}>
              {t.discovery.apply}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 px-4 pb-4">
          <Select
            label={t.discovery.mineral}
            value={mineralId}
            options={[
              { value: '', label: t.discovery.anyMineral },
              ...(minerals.data ?? []).map((mineral) => ({
                value: mineral.id,
                label: mineral.name,
              })),
            ]}
            onChange={(event) => setMineralId(event.target.value)}
          />

          <Select
            label={t.discovery.withinDistance}
            value={maxDistance}
            options={DISTANCE_OPTIONS}
            onChange={(event) => setMaxDistance(event.target.value)}
            disabled={!destination}
          />

          <label className="flex min-h-[var(--touch-min)] items-center justify-between gap-3">
            <span className="text-body text-ink">{t.discovery.inStockOnly}</span>
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(event) => setInStockOnly(event.target.checked)}
              className="size-5 accent-[var(--color-primary-600)]"
            />
          </label>
        </div>
      </BottomSheet>
    </Screen>
  );
}

function ViewToggle({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-label transition-colors',
        active ? 'bg-primary-50 text-primary-700' : 'text-ink-muted',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/**
 * Prioritised exactly as the product context asks: name, location, distance,
 * available mineral, available quantity, operational status.
 */
function StockPointRow({
  result,
  index,
  showIndex,
  hasDestination,
  mineralName,
  highlighted,
  onOpen,
}: {
  result: StockPointSearchResult;
  index: number;
  showIndex: boolean;
  hasDestination: boolean;
  mineralName: (id: ID) => string;
  highlighted: boolean;
  onOpen: () => void;
}) {
  const { stockPoint, distanceKm } = result;
  const status = statusPresentation.stockPoint(stockPoint.status);

  const topMineral = [...stockPoint.minerals].sort(
    (a, b) => b.availableQuantity.value - a.availableQuantity.value,
  )[0];

  return (
    <ListRow
      className={highlighted ? 'bg-primary-50/50' : undefined}
      /* In map view the number ties this row to its point on the map. */
      leading={showIndex ? <span className="text-label font-semibold">{index}</span> : <Warehouse size={17} />}
      leadingTone={stockPoint.status === 'OPERATIONAL' ? 'primary' : 'neutral'}
      title={stockPoint.name}
      subtitle={
        hasDestination
          ? `${stockPoint.address.taluka}, ${stockPoint.address.district} · ${distanceKm} km`
          : `${stockPoint.address.taluka}, ${stockPoint.address.district}`
      }
      {...(topMineral
        ? {
            detail: `${mineralName(topMineral.mineralId)} · ${formatQuantity(topMineral.availableQuantity)}`,
          }
        : {})}
      meta={<StatusBadge label={status.label} tone={status.tone} size="sm" />}
      onClick={onOpen}
    />
  );
}
