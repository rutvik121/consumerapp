import { useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { ChevronUp, SlidersHorizontal, Warehouse, X } from 'lucide-react';
import type { ID, StockPointSearchResult } from '@/domain';
import { formatQuantity, statusPresentation } from '@/rules';
import {
  BottomSheet,
  Button,
  EmptyState,
  ErrorState,
  ListGroup,
  ListRow,
  SearchInput,
  Select,
  StatusBadge,
  Surface,
} from '@/design-system';
import { ROUTES, Screen } from '@/navigation';
import { mineralRepository, stockPointRepository, useAsync } from '@/data';
import { useOperatingContext } from '@/state';
import { useCopy } from '@/content';
import { StockPointMap } from './StockPointMap';

const DISTANCE_OPTIONS = [
  { value: '', label: 'Any distance' },
  { value: '25', label: 'Within 25 km' },
  { value: '50', label: 'Within 50 km' },
  { value: '100', label: 'Within 100 km' },
];

const SEARCH_LOCATIONS = [
  { name: 'mumbai', latitude: 19.076, longitude: 72.8777 },
  { name: 'nagpur', latitude: 21.1458, longitude: 79.0882 },
  { name: 'delhi', latitude: 28.6139, longitude: 77.209 },
];

function locationFromSearch(value: string) {
  const normalized = value.trim().toLowerCase();
  const nearMatch = normalized.match(/\bnear\s+([a-z]+(?:\s+[a-z]+)*)/);
  if (!nearMatch) return null;

  const locationName = nearMatch[1].trim();
  return SEARCH_LOCATIONS.find(
    (location) =>
      locationName === location.name || locationName.startsWith(`${location.name} `),
  ) ?? null;
}

export function StockPointMapScreen() {
  const context = useOperatingContext();
  const navigate = useNavigate();
  const t = useCopy();

  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [mineralId, setMineralId] = useState<ID | ''>('');
  const [maxDistance, setMaxDistance] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedOnMap, setSelectedOnMap] = useState<ID | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [noResultsDismissed, setNoResultsDismissed] = useState(false);

  const destination = context?.destination ?? null;
  const searchedLocation = locationFromSearch(submittedSearch);
  const searchTerm = searchedLocation
    ? submittedSearch
        .replace(/\bnear\s+[a-z]+(?:\s+[a-z]+)*/i, '')
        .replace(/\bstock\s*points?\b/i, '')
        .trim()
    : submittedSearch;
  const defaultOrigin = destination?.geo ?? { latitude: 19.076, longitude: 72.877 };
  const searchRadiusKm = maxDistance
    ? Number(maxDistance)
    : searchedLocation
      ? 100
      : 100;

  const minerals = useAsync(() => mineralRepository.listAll(), []);

  const results = useAsync(
    () =>
      stockPointRepository.search({
        ...(searchTerm ? { search: searchTerm } : {}),
        ...(mineralId ? { mineralId } : {}),
        near: searchedLocation
          ? { latitude: searchedLocation.latitude, longitude: searchedLocation.longitude }
          : defaultOrigin,
        maxDistanceKm: searchRadiusKm,
        ...(inStockOnly ? { availableOnly: true } : {}),
      }),
    [
      searchTerm,
      mineralId,
      maxDistance,
      inStockOnly,
      defaultOrigin.latitude,
      defaultOrigin.longitude,
      searchedLocation?.latitude,
      searchedLocation?.longitude,
    ],
  );

  const activeFilters =
    (mineralId ? 1 : 0) + (maxDistance ? 1 : 0) + (inStockOnly ? 1 : 0);
  const mineralName = (id: ID) =>
    minerals.data?.find((mineral) => mineral.id === id)?.name ?? 'Mineral';
  const mapOrigin = searchedLocation
    ? { latitude: searchedLocation.latitude, longitude: searchedLocation.longitude }
    : defaultOrigin;
  const mapOriginLabel = searchedLocation?.name
    ? `${searchedLocation.name[0].toUpperCase()}${searchedLocation.name.slice(1)}`
    : destination?.label ?? 'Current location';

  return (
    <Screen
      title={t.discovery.title}
      onBack
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div className="absolute inset-0 z-0 overflow-hidden bg-neutral-100">
          <StockPointMap
            origin={mapOrigin}
            originLabel={mapOriginLabel}
            results={results.data ?? []}
            selectedId={selectedOnMap}
            onSelect={setSelectedOnMap}
            mineralName={mineralName}
            onViewDetails={(stockPointId) => navigate(ROUTES.stockPointDetails(stockPointId))}
          />
      </div>

      <div className="absolute inset-x-3 top-3 z-10">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setNoResultsDismissed(false);
            setSubmittedSearch(search.trim());
          }}
        >
          <SearchInput
            value={search}
            onChange={setSearch}
            onClear={() => setSubmittedSearch('')}
            placeholder={t.discovery.searchPlaceholder}
            className="rounded-2xl border border-line/80 shadow-e3"
            endAdornment={
              <button
                type="button"
                aria-label={t.discovery.filters}
                onClick={() => setFiltersOpen(true)}
                className={[
                  'relative flex size-8 shrink-0 items-center justify-center rounded-full',
                  'text-ink-muted transition-colors hover:bg-neutral-200',
                  activeFilters > 0 ? 'text-primary-700' : '',
                ].join(' ')}
              >
                <SlidersHorizontal size={16} aria-hidden />
                {activeFilters > 0 && (
                  <span className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-primary-600" />
                )}
              </button>
            }
          />
        </form>
      </div>

      {results.loading && (
        <div className="absolute left-1/2 top-36 z-10 -translate-x-1/2 rounded-full bg-surface px-3 py-1.5 text-caption text-ink-secondary shadow-e2">
          Loading nearby stock points…
        </div>
      )}

      {results.error && (
        <div className="absolute inset-x-4 top-36 z-10">
          <ErrorState onRetry={results.reload} />
        </div>
      )}

      {results.data && results.data.length === 0 && !noResultsDismissed && (
        <div className="absolute inset-x-4 top-40 z-10">
          <Surface className="relative p-4 shadow-e2">
            <button
              type="button"
              aria-label="Close no results message"
              onClick={() => setNoResultsDismissed(true)}
              className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-neutral-100"
            >
              <X size={17} aria-hidden />
            </button>
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
                    setSubmittedSearch('');
                    setNoResultsDismissed(false);
                  }}
                >
                  {t.discovery.clearAll}
                </Button>
              }
            />
          </Surface>
        </div>
      )}

      {results.data && results.data.length > 0 && (
        <div
          className={[
            'absolute inset-x-0 bottom-0 z-10 overflow-hidden rounded-t-2xl border-t border-line bg-surface/95 shadow-e3 backdrop-blur transition-[max-height]',
            drawerOpen ? 'max-h-[50%]' : 'max-h-16',
          ].join(' ')}
        >
          <button
            type="button"
            onClick={() => setDrawerOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            aria-expanded={drawerOpen}
          >
            <span>
              <span className="block text-label font-medium text-ink">Nearby stock points</span>
            </span>
            <ChevronUp size={18} className={drawerOpen ? 'rotate-180 text-ink-muted' : 'text-ink-muted'} />
          </button>
          {drawerOpen && (
            <ListGroup className="max-h-[calc(50vh-64px)] overflow-y-auto px-2 pb-1">
              {results.data.map((result, index) => (
                <StockPointRow
                  key={result.stockPoint.id}
                  result={result}
                  index={index + 1}
                  showIndex
                  hasDestination={Boolean(destination)}
                  mineralName={mineralName}
                  highlighted={result.stockPoint.id === selectedOnMap}
                  onOpen={() => navigate(ROUTES.stockPointDetails(result.stockPoint.id))}
                />
              ))}
            </ListGroup>
          )}
        </div>
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
