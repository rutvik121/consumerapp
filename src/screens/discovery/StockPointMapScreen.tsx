import { useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { SlidersHorizontal, Warehouse } from 'lucide-react';
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
} from '@/design-system';
import { OrganizationContextBar, ROUTES, Screen } from '@/navigation';
import { mineralRepository, packageRepository, projectRepository, stockPointRepository, useAsync } from '@/data';
import { useCurrentOrganization, useOperatingContext, useOrganizationContextStore } from '@/state';
import { useCopy } from '@/content';
import { StockPointMap } from './StockPointMap';

const DISTANCE_OPTIONS = [
  { value: '', label: 'Any distance' },
  { value: '25', label: 'Within 25 km' },
  { value: '50', label: 'Within 50 km' },
  { value: '100', label: 'Within 100 km' },
];

export function StockPointMapScreen() {
  const context = useOperatingContext();
  const navigate = useNavigate();
  const t = useCopy();
  const organization = useCurrentOrganization();
  const setProject = useOrganizationContextStore((state) => state.setProject);
  const setPackage = useOrganizationContextStore((state) => state.setPackage);

  const [search, setSearch] = useState('');
  const [mineralId, setMineralId] = useState<ID | ''>('');
  const [maxDistance, setMaxDistance] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<ID | null>(null);
  const [selectedOnMap, setSelectedOnMap] = useState<ID | null>(null);

  const destination = context?.destination ?? null;

  const minerals = useAsync(() => mineralRepository.listAll(), []);
  const projectScope = useAsync(async () => {
    if (!organization) return { projects: [], packages: [] };

    const [projects, packages] = await Promise.all([
      projectRepository.listByOrganization(organization.id),
      packageRepository.listByOrganization(organization.id),
    ]);

    return { projects, packages };
  }, [organization?.id]);

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
  const projectOptions = projectScope.data?.projects ?? [];
  const packageOptions =
    selectedProjectId && projectScope.data
      ? projectScope.data.packages.filter((pkg) => pkg.projectId === selectedProjectId)
      : [];

  const mineralName = (id: ID) =>
    minerals.data?.find((mineral) => mineral.id === id)?.name ?? 'Mineral';

  if (context && !destination) {
    return (
      <Screen title={t.discovery.title} onBack>
        <EmptyState
          icon={<Warehouse size={22} />}
          title={t.discovery.noDestination}
          description={t.discovery.noDestinationBody}
          action={
            <Button onClick={() => setProjectPickerOpen(true)}>{t.discovery.chooseProject}</Button>
          }
        />

        <BottomSheet
          open={projectPickerOpen}
          onClose={() => {
            setProjectPickerOpen(false);
            setSelectedProjectId(null);
          }}
          title={selectedProjectId ? 'Choose a package' : 'Choose a project'}
        >
          <div className="space-y-2 px-4 pb-4">
            {selectedProjectId ? (
              packageOptions.length > 0 ? (
                packageOptions.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl border border-line bg-surface px-3 py-3 text-left transition-colors hover:bg-primary-50"
                    onClick={() => {
                      setPackage(pkg);
                      setProjectPickerOpen(false);
                      setSelectedProjectId(null);
                    }}
                  >
                    <div>
                      <div className="text-body font-medium text-ink">{pkg.name}</div>
                      <div className="text-body-sm text-ink-secondary">
                        {pkg.siteAddress.taluka}, {pkg.siteAddress.district}
                      </div>
                    </div>
                    <span className="text-caption text-ink-muted">{pkg.code}</span>
                  </button>
                ))
              ) : (
                <EmptyState
                  icon={<Warehouse size={22} />}
                  title="No packages in this project"
                  description="Create a package first so this project can be used for stock-point discovery."
                />
              )
            ) : projectScope.loading ? (
              <LoadingState variant="list" rows={3} />
            ) : projectOptions.length > 0 ? (
              projectOptions.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl border border-line bg-surface px-3 py-3 text-left transition-colors hover:bg-primary-50"
                  onClick={() => {
                    setProject(project);
                    setSelectedProjectId(project.id);
                  }}
                >
                  <div>
                    <div className="text-body font-medium text-ink">{project.name}</div>
                    <div className="text-body-sm text-ink-secondary">{project.location.district}</div>
                  </div>
                  <span className="text-caption text-ink-muted">{project.code}</span>
                </button>
              ))
            ) : (
              <EmptyState
                icon={<Warehouse size={22} />}
                title="No projects yet"
                description="Create a project before starting a stock-point enquiry."
              />
            )}
          </div>
        </BottomSheet>
      </Screen>
    );
  }

  return (
    <Screen
      title={t.discovery.title}
      onBack
      context={<OrganizationContextBar showChange={false} />}
      className="flex flex-col"
    >
      <Surface className="sticky top-0 z-20 border-b border-line px-4 py-3">
        <SearchInput value={search} onChange={setSearch} placeholder={t.discovery.searchPlaceholder} />

        <div className="mt-3 flex items-center gap-2">
          <Button
            size="sm"
            variant={activeFilters > 0 ? 'subtle' : 'secondary'}
            leftIcon={<SlidersHorizontal size={14} />}
            onClick={() => setFiltersOpen(true)}
          >
            {activeFilters > 0 ? `${t.discovery.filters} · ${activeFilters}` : t.discovery.filters}
          </Button>

          <Button size="sm" variant="secondary" onClick={() => navigate(ROUTES.stockPoints)}>
            List view
          </Button>
        </div>

        {activeFilters > 0 && (
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {mineralId && <Chip active label={mineralName(mineralId)} onRemove={() => setMineralId('')} />}
            {maxDistance && (
              <Chip active label={`Within ${maxDistance} km`} onRemove={() => setMaxDistance('')} />
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

      {results.data && results.data.length > 0 && destination && (
        <div className="relative flex-1 min-h-[360px] w-full overflow-hidden bg-neutral-100">
          <StockPointMap
            origin={destination.geo}
            originLabel={destination.label}
            results={results.data}
            selectedId={selectedOnMap}
            onSelect={setSelectedOnMap}
          />
        </div>
      )}

      {results.data && results.data.length > 0 && (
        <BottomSheet
          open
          onClose={() => undefined}
          title={t.discovery.title}
          description={t.discovery.resultCount(results.data.length)}
          className="max-h-[52%]"
        >
          <ListGroup className="px-2 pb-1">
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
        </BottomSheet>
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
