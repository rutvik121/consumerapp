import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPinned, Search, Warehouse } from 'lucide-react';
import { useCopy } from '@/content';
import { mineralRepository, stockPointRepository, useAsync } from '@/data';
import { Button, EmptyState, ErrorState, LoadingState, SectionHeader, Surface } from '@/design-system';
import { ROUTES, Screen } from '@/navigation';
import { useOperatingContext } from '@/state';

export function MineralScreen() {
  const navigate = useNavigate();
  const t = useCopy();
  const context = useOperatingContext();

  const destination = context?.destination ?? null;

  const minerals = useAsync(() => mineralRepository.listAll(), []);
  const nearbyPoints = useAsync(
    () =>
      stockPointRepository.search({
        ...(destination ? { near: destination.geo } : {}),
        availableOnly: true,
      }),
    [destination?.geo.latitude, destination?.geo.longitude],
  );

  const mineralCards = (minerals.data ?? []).map((mineral) => {
    const matches = (nearbyPoints.data ?? []).filter(
      (result) =>
        result.stockPoint.minerals.some((holding) => holding.mineralId === mineral.id),
    );
    const nearest = matches.reduce<number | null>((closest, result) => {
      const distance = result.distanceKm;
      if (closest === null || distance < closest) return distance;
      return closest;
    }, null);

    return {
      ...mineral,
      sources: matches.length,
      nearestKm: nearest,
    };
  });

  return (
    <Screen title={t.discovery.title} onBack>
      <div className="space-y-5 pb-8">
        <Surface className="border-y border-line px-4 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-overline uppercase text-ink-muted">{t.discovery.mineral}</p>
              <h2 className="mt-1 text-title-lg text-ink">{t.consumerHome.needMineral}</h2>
            </div>
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Search size={18} />
            </div>
          </div>
          <p className="mt-2 text-body text-ink-secondary">{t.consumerHome.needMineralBody}</p>
          <Button
            size="lg"
            fullWidth
            className="mt-4"
            leftIcon={<MapPinned size={16} />}
            onClick={() => navigate(ROUTES.stockPoints)}
          >
            {t.discovery.title}
          </Button>
        </Surface>

        <SectionHeader title={t.consumerHome.mineralAvailability} />

        {minerals.loading || nearbyPoints.loading ? (
          <LoadingState variant="list" rows={4} />
        ) : null}

        {minerals.error || nearbyPoints.error ? (
          <ErrorState onRetry={() => { minerals.reload(); nearbyPoints.reload(); }} />
        ) : null}

        {!minerals.loading && !minerals.error && mineralCards.length === 0 ? (
          <EmptyState
            icon={<Warehouse size={22} />}
            title="No minerals listed"
            description="Mineral catalog entries will appear here once the supply list is available."
          />
        ) : null}

        {mineralCards.length > 0 && (
          <div className="space-y-3">
            {mineralCards.map((mineral) => (
              <Surface key={mineral.id} className="border border-line bg-surface px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-label text-ink-secondary">{mineral.code}</p>
                    <h3 className="mt-0.5 text-title text-ink">{mineral.name}</h3>
                  </div>
                  <span className="rounded-full bg-success-50 px-2 py-1 text-caption font-medium text-success-700">
                    {t.consumerHome.sourceCount(mineral.sources)}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-md bg-fill px-3 py-2">
                    <p className="text-caption text-ink-muted">{t.consumerHome.nearestSource}</p>
                    <p className="mt-1 text-body text-ink">
                      {mineral.nearestKm === null
                        ? t.consumerHome.notAvailable
                        : `${mineral.nearestKm.toFixed(1)} km`}
                    </p>
                  </div>
                  <div className="rounded-md bg-fill px-3 py-2">
                    <p className="text-caption text-ink-muted">{t.consumerHome.unit}</p>
                    <p className="mt-1 text-body text-ink">{mineral.defaultUnit}</p>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  fullWidth
                  className="mt-3"
                  rightIcon={<ArrowRight size={14} />}
                  onClick={() => navigate(ROUTES.stockPoints)}
                >
                  {t.consumerHome.viewStockPoints}
                </Button>
              </Surface>
            ))}
          </div>
        )}
      </div>
    </Screen>
  );
}
