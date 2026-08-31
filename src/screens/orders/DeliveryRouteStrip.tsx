import type { Delivery } from '@/domain';
import { deliveryProgress } from '@/rules';
import { cn } from '@/design-system';

/**
 * Source → destination progress, derived from ACTUAL reported position.
 *
 * The fill is how much of the source-to-destination distance the vehicle has
 * genuinely covered, computed from its last reported location — not an
 * animation on a timer. That distinction is the whole difference between an
 * operational tracking view and a courier progress bar: this one can be wrong
 * only if the vehicle's reported position is wrong.
 *
 * It supports the movement record below; it never replaces it.
 */
export function DeliveryRouteStrip({ delivery }: { delivery: Delivery }) {
  const progress = deliveryProgress(delivery);
  const arrived = progress >= 1;

  return (
    <div className="px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-overline text-ink-muted uppercase">Source</p>
          <p className="mt-1 truncate text-body-sm font-medium text-ink">
            {delivery.permit.sourceQuarryName}
          </p>
        </div>
        <div className="min-w-0 flex-1 text-right">
          <p className="text-overline text-ink-muted uppercase">Destination</p>
          <p className="mt-1 truncate text-body-sm font-medium text-ink">
            {delivery.destination.label}
          </p>
        </div>
      </div>

      <div className="relative mt-4 mb-2 h-1.5" aria-hidden>
        <div className="absolute inset-0 rounded-full bg-neutral-200" />
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-[width]',
            arrived ? 'bg-success-500' : 'bg-primary-500',
          )}
          style={{ width: `${progress * 100}%` }}
        />
        {/* Source and destination anchors, so the track reads as a journey. */}
        <span className="absolute top-1/2 left-0 size-2.5 -translate-x-0 -translate-y-1/2 rounded-full bg-primary-600" />
        <span
          className={cn(
            'absolute top-1/2 right-0 size-2.5 -translate-y-1/2 rounded-full',
            arrived ? 'bg-success-500' : 'bg-neutral-300',
          )}
        />
        {!arrived && (
          <span
            className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-primary-600"
            style={{ left: `${progress * 100}%` }}
          />
        )}
      </div>

      <p className="text-caption text-ink-muted">
        {arrived
          ? 'Arrived at destination'
          : `Approximately ${Math.round(progress * 100)}% of the route covered`}
      </p>
    </div>
  );
}
