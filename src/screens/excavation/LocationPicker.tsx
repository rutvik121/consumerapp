import { useRef, useState, type MouseEvent } from 'react';
import { Crosshair, MapPin } from 'lucide-react';
import type { GeoPoint } from '@/domain';
import { Button, cn } from '@/design-system';
import { useCopy } from '@/content';

export interface LocationLandmark {
  code: string;
  name: string;
  geo: GeoPoint;
}

export interface LocationPickerProps {
  /** Where the window opens — the selected taluka or district centroid. */
  centre: GeoPoint;
  /** The placed pin, or null while the applicant has not marked the site. */
  value: GeoPoint | null;
  onChange: (point: GeoPoint) => void;
  /** Villages shown for orientation, so a tap lands somewhere meaningful. */
  landmarks: LocationLandmark[];
  error?: string;
}

/**
 * Smallest window the frame will ever show, in degrees either side of centre.
 *
 * A floor rather than a fixed size: with several villages the window is drawn
 * from their own extent so they spread across the frame instead of clustering
 * into an unreadable knot of overlapping labels. The floor only matters when
 * there is a single landmark, or none.
 */
const MIN_HALF_SPAN = 0.02;

/** Above this many landmarks the names are dropped and only the dots remain. */
const MAX_LABELLED_LANDMARKS = 8;

/**
 * How far apart two landmarks must be, as a percentage of the frame, before
 * both can carry a name. Villages in one taluka sit close together, and a
 * frame that also has to contain a distant pin squeezes them closer still —
 * two names printed on top of each other read as neither.
 */
const LABEL_CLEARANCE = { x: 24, y: 11 };

/**
 * MARK THE EXCAVATION SITE.
 *
 * The web form lets the applicant drop a pin; the mobile form must do the
 * same, because a survey number alone does not tell the department which
 * corner of it will be dug. Two ways in, because either can fail:
 *
 *   TAP THE MAP            works anywhere, including from an office
 *   USE MY LOCATION        one tap when the applicant is standing on the site,
 *                          and permission may be refused
 *
 * A SCHEMATIC map, not a geographic one — the same deliberate choice as
 * @/screens/discovery/StockPointMap, and for the same reason: real tiles need
 * a provider and a key, and a half-loaded tile layer would communicate less
 * than a clean local frame with the villages marked on it. PRODUCTION swaps
 * this component for a real map; the contract — a GeoPoint in, a GeoPoint out
 * — is what the rest of the flow depends on and does not change.
 *
 * The window is derived from the landmarks so it always frames the taluka the
 * applicant just chose. Each axis is stretched independently to fill the box,
 * so bearings within the frame are indicative rather than surveyed — which is
 * why the coordinates are always shown numerically beneath it. A schematic pin
 * nobody can read back is not evidence, and this is a legal document.
 */
export function LocationPicker({
  centre,
  value,
  onChange,
  landmarks,
  error,
}: LocationPickerProps) {
  const t = useCopy();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  /* The window: wide enough to hold every landmark and the placed pin. */
  const points = [...landmarks.map((landmark) => landmark.geo), centre, ...(value ? [value] : [])];
  const halfSpanLat = Math.max(
    MIN_HALF_SPAN,
    ...points.map((point) => Math.abs(point.latitude - centre.latitude) * 1.35),
  );
  const halfSpanLng = Math.max(
    MIN_HALF_SPAN,
    ...points.map((point) => Math.abs(point.longitude - centre.longitude) * 1.35),
  );

  /** Geographic point → percentage position inside the frame. */
  const toFrame = (point: GeoPoint) => ({
    left: ((point.longitude - centre.longitude) / (halfSpanLng * 2) + 0.5) * 100,
    // Latitude grows north; the frame's y grows downward.
    top: (0.5 - (point.latitude - centre.latitude) / (halfSpanLat * 2)) * 100,
  });

  /** Percentage position inside the frame → geographic point. */
  const toGeo = (leftRatio: number, topRatio: number): GeoPoint => ({
    latitude: Number((centre.latitude + (0.5 - topRatio) * halfSpanLat * 2).toFixed(5)),
    longitude: Number((centre.longitude + (leftRatio - 0.5) * halfSpanLng * 2).toFixed(5)),
  });

  function handleTap(event: MouseEvent<HTMLDivElement>) {
    const surface = surfaceRef.current;
    if (!surface) return;
    const bounds = surface.getBoundingClientRect();
    setLocationError(null);
    onChange(
      toGeo(
        (event.clientX - bounds.left) / bounds.width,
        (event.clientY - bounds.top) / bounds.height,
      ),
    );
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationError(t.excavation.locationUnavailable);
      return;
    }

    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        onChange({
          latitude: Number(position.coords.latitude.toFixed(5)),
          longitude: Number(position.coords.longitude.toFixed(5)),
        });
      },
      (failure) => {
        setLocating(false);
        setLocationError(
          failure.code === failure.PERMISSION_DENIED
            ? t.excavation.locationDenied
            : t.excavation.locationUnavailable,
        );
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  const pin = value ? toFrame(value) : null;
  const placed = landmarks.map((landmark) => ({ ...landmark, frame: toFrame(landmark.geo) }));
  const showLabels =
    placed.length <= MAX_LABELLED_LANDMARKS &&
    placed.every((landmark, index) =>
      placed.slice(index + 1).every(
        (other) =>
          Math.abs(landmark.frame.left - other.frame.left) >= LABEL_CLEARANCE.x ||
          Math.abs(landmark.frame.top - other.frame.top) >= LABEL_CLEARANCE.y,
      ),
    );

  return (
    <div>
      <p className="mb-1.5 text-label text-ink-secondary">
        {t.excavation.markOnMap}
        <span className="ml-0.5 text-danger-500">*</span>
      </p>
      <p className="mb-2 text-caption text-ink-muted">{t.excavation.markOnMapHint}</p>

      <div
        ref={surfaceRef}
        onClick={handleTap}
        role="application"
        aria-label={t.excavation.markOnMap}
        className={cn(
          'relative h-56 w-full cursor-crosshair overflow-hidden rounded-lg border bg-neutral-50',
          error && !value ? 'border-danger-500' : 'border-line-strong',
        )}
      >
        {/* A reference grid. It carries no geographic claim beyond scale. */}
        <svg className="absolute inset-0 size-full" aria-hidden>
          <defs>
            <pattern id="site-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M28 0 L0 0 0 28" fill="none" stroke="var(--color-line)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#site-grid)" />
        </svg>

        {placed.map((landmark) => {
          const position = landmark.frame;
          return (
            <span
              key={landmark.code}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${position.left}%`, top: `${position.top}%` }}
            >
              <span className="flex flex-col items-center gap-0.5">
                <span className="size-1.5 rounded-full bg-ink-muted" aria-hidden />
                {showLabels && (
                  <span className="whitespace-nowrap rounded bg-surface/85 px-1 text-caption text-ink-secondary">
                    {landmark.name}
                  </span>
                )}
              </span>
            </span>
          );
        })}

        {pin && (
          <span
            className="absolute -translate-x-1/2 -translate-y-full text-danger-600"
            style={{ left: `${pin.left}%`, top: `${pin.top}%` }}
          >
            <MapPin size={28} fill="currentColor" strokeWidth={1.5} className="text-danger-600" />
          </span>
        )}

        {!value && (
          <span className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-caption text-ink-muted">
            {t.excavation.noPinYet}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          loading={locating}
          leftIcon={<Crosshair size={14} />}
          onClick={useCurrentLocation}
        >
          {locating ? t.excavation.locatingYou : t.excavation.useCurrentLocation}
        </Button>

        {value && (
          <span className="tabular text-caption text-ink-secondary">
            {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
          </span>
        )}
      </div>

      {locationError && <p className="mt-1.5 text-caption text-warning-700">{locationError}</p>}
      {error && !value && <p className="mt-1.5 text-caption text-danger-600">{error}</p>}
    </div>
  );
}
