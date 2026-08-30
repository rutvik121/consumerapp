import type { GeoPoint, StockPointSearchResult } from '@/domain';
import { cn } from '@/design-system';

export interface StockPointMapProps {
  origin: GeoPoint;
  originLabel: string;
  results: StockPointSearchResult[];
  selectedId?: string | null;
  onSelect: (stockPointId: string) => void;
}

/**
 * A SCHEMATIC map, not a geographic one.
 *
 * The question this view answers is "which sources are near my site, and in
 * which direction?" — not "what does the road network look like". So it plots
 * true relative bearing and distance around the destination, with distance
 * rings for scale, and skips the basemap entirely.
 *
 * This is a deliberate prototype decision rather than a limitation: real map
 * tiles need a network provider and an API key, and a half-loaded tile layer
 * would communicate less than this does. PRODUCTION replaces this component
 * with a real map; everything around it — the result list, the filters, the
 * selection behaviour — stays as it is.
 *
 * SCALE: radius is proportional to the SQUARE ROOT of distance, not to
 * distance. Mineral results are heavily clustered near the site with the
 * occasional distant outlier, and a linear scale collapses every useful result
 * into an unreadable blob at the centre while one 600 km result owns the
 * frame. The square root spreads the near results — the ones the user is
 * actually choosing between — while still showing the far one inside the view.
 * Rings are labelled with real distances so the compression is never hidden.
 */
export function StockPointMap({
  origin,
  originLabel,
  results,
  selectedId,
  onSelect,
}: StockPointMapProps) {
  const SIZE = 260;
  const CENTRE = SIZE / 2;
  const PADDING = 26;
  const maxRadius = CENTRE - PADDING;

  const furthest = Math.max(...results.map((result) => result.distanceKm), 1);

  /** Square-root scale — see the note above. */
  const radiusFor = (distanceKm: number) =>
    Math.sqrt(Math.min(distanceKm, furthest) / furthest) * maxRadius;

  /* Rings at round, human distances rather than arbitrary fractions. */
  const LADDER = [5, 10, 25, 50, 100, 250, 500, 1000, 2000];
  const rings = LADDER.filter((step) => step <= furthest).slice(-3);
  if (rings.length === 0) rings.push(Math.round(furthest));

  const points = results.map((result, index) => {
    const { stockPoint, distanceKm } = result;

    // Equirectangular offset around the origin — accurate enough at this scale.
    const dx = (stockPoint.geo.longitude - origin.longitude) *
      Math.cos((origin.latitude * Math.PI) / 180);
    const dy = stockPoint.geo.latitude - origin.latitude;

    const magnitude = Math.hypot(dx, dy) || 1;
    const scaled = radiusFor(distanceKm);

    return {
      id: stockPoint.id,
      name: stockPoint.name,
      distanceKm,
      /** Matches the position in the result list, so map and list correlate. */
      index: index + 1,
      x: CENTRE + (dx / magnitude) * scaled,
      // SVG y grows downward; latitude grows north.
      y: CENTRE - (dy / magnitude) * scaled,
    };
  });

  return (
    <div className="bg-surface px-4 py-4">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="mx-auto block w-full max-w-[300px]"
        role="img"
        aria-label={`Stock points around ${originLabel}`}
      >
        {rings.map((step) => (
          <circle
            key={step}
            cx={CENTRE}
            cy={CENTRE}
            r={radiusFor(step)}
            fill="none"
            stroke="var(--color-line)"
            strokeDasharray="3 4"
          />
        ))}

        {/* A map without a scale is decoration. */}
        {rings.map((step) => (
          <text
            key={`label-${step}`}
            x={CENTRE + 3}
            y={CENTRE - radiusFor(step) - 3}
            fontSize="8"
            fill="var(--color-ink-muted)"
          >
            {step} km
          </text>
        ))}

        {points.map((point) => {
          const selected = point.id === selectedId;
          return (
            <g
              key={point.id}
              onClick={() => onSelect(point.id)}
              className="cursor-pointer"
              role="button"
              aria-label={`${point.name}, ${point.distanceKm} kilometres`}
            >
              <line
                x1={CENTRE}
                y1={CENTRE}
                x2={point.x}
                y2={point.y}
                stroke={selected ? 'var(--color-primary-400)' : 'var(--color-line)'}
                strokeWidth={selected ? 1.5 : 1}
              />
              <circle
                cx={point.x}
                cy={point.y}
                r={selected ? 9 : 8}
                fill={selected ? 'var(--color-primary-600)' : 'var(--color-primary-500)'}
                stroke="var(--color-surface)"
                strokeWidth="2"
              />
              {/* The number ties this point to its row in the list below. */}
              <text
                x={point.x}
                y={point.y + 3}
                fontSize="9"
                fontWeight="600"
                textAnchor="middle"
                fill="#ffffff"
                pointerEvents="none"
              >
                {point.index}
              </text>
            </g>
          );
        })}

        {/* The destination sits at the centre — everything is relative to it. */}
        <circle cx={CENTRE} cy={CENTRE} r="5" fill="var(--color-success-500)" />
        <circle
          cx={CENTRE}
          cy={CENTRE}
          r="10"
          fill="none"
          stroke="var(--color-success-500)"
          strokeOpacity="0.35"
        />
      </svg>

      <p className="mt-3 text-center text-caption text-ink-muted">
        Distance and direction from{' '}
        <span className="font-medium text-ink-secondary">{originLabel}</span>
      </p>

      {selectedId && (
        <div className="mt-3 border-t border-line pt-3">
          {points
            .filter((point) => point.id === selectedId)
            .map((point) => (
              <p key={point.id} className={cn('text-center text-body-sm text-ink')}>
                {point.name} · <span className="tabular">{point.distanceKm} km</span>
              </p>
            ))}
        </div>
      )}
    </div>
  );
}
