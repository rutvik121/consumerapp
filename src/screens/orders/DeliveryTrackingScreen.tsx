import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, Circle, CheckCircle2, FileCheck, MapPinned, Phone, Truck } from 'lucide-react';
import { CircleMarker, MapContainer, Polyline, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Delivery } from '@/domain';
import { formatQuantity, relativeTime, statusPresentation } from '@/rules';
import {
  Button,
  DetailList,
  ErrorState,
  LoadingState,
  SectionHeader,
  StatusBadge,
  Surface,
  cn,
} from '@/design-system';
import { ROUTES, Screen } from '@/navigation';
import { deliveryRepository, mineralRepository, useAsync } from '@/data';
import { useCopy } from '@/content';
import { DigiTpPassModal } from './DigiTpPassModal';

/**
 * DELIVERY & TRANSIT DETAILS — an operational workflow for tracking & compliance.
 */
export function DeliveryTrackingScreen() {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const navigate = useNavigate();
  const t = useCopy();
  const [isDigiTpOpen, setIsDigiTpOpen] = useState(false);

  const query = useAsync(async () => {
    if (!deliveryId) throw new Error('A delivery is required');

    const delivery = await deliveryRepository.getById(deliveryId);
    if (!delivery) throw new Error('Delivery not found');

    const minerals = await mineralRepository.listAll();
    return { delivery, minerals };
  }, [deliveryId]);

  const delivery = query.data?.delivery;
  const mineral = query.data?.minerals.find(
    (candidate) => candidate.id === delivery?.permit.mineralId,
  );
  const lastUpdate = delivery?.tracking.at(-1);
  const canReceive = delivery?.status === 'ARRIVED_AT_DESTINATION';

  return (
    <Screen
      title="Delivery & Transit Details"
      {...(delivery ? { subtitle: delivery.deliveryNumber } : {})}
      onBack
      footer={
        canReceive ? (
          <Button size="lg" fullWidth onClick={() => navigate(ROUTES.receive)}>
            {t.tracking.receiveNow}
          </Button>
        ) : undefined
      }
    >
      {query.loading && <LoadingState variant="list" rows={5} />}
      {query.error && <ErrorState onRetry={query.reload} />}

      {query.data && delivery && (
        <div className="pb-8">
          {/* Modal for official DigiTP Pass View */}
          <DigiTpPassModal
            isOpen={isDigiTpOpen}
            onClose={() => setIsDigiTpOpen(false)}
            delivery={delivery}
          />

          {/* ---------- 1. Which vehicle, carrying what ---------- */}
          <Surface className="border-b border-line px-4 py-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-600">
                <Truck size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="tabular text-title-lg text-ink">
                  {delivery.vehicle.registrationNumber}
                </p>
                <p className="mt-0.5 text-body text-ink-secondary">
                  {mineral?.name} ·{' '}
                  <span className="tabular">{formatQuantity(delivery.dispatchedQuantity)}</span>
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <StatusBadge {...statusPresentation.delivery(delivery.status)} />
              {lastUpdate && (
                <span className="text-caption text-ink-muted">
                  {t.tracking.lastUpdate} {relativeTime(lastUpdate.at)}
                </span>
              )}
            </div>

            {/* Quick Action to View DigiTP Pass */}
            <div className="mt-4">
              <Button
                variant="subtle"
                fullWidth
                leftIcon={<FileCheck size={16} />}
                onClick={() => setIsDigiTpOpen(true)}
                className="border border-[#c6daf6] bg-[#eef5fd] text-[#1241a6] hover:bg-[#dfeefe] font-semibold"
              >
                View DigiTP
              </Button>
            </div>

            {canReceive && (
              <p className="mt-3 rounded-md bg-warning-50 px-3 py-2 text-body-sm text-warning-700">
                {t.tracking.arrivedNote}
              </p>
            )}
          </Surface>

          {/* ---------- 2. The transport transaction behind it ---------- */}
          <SectionHeader title={t.tracking.transportPermit} />
          <Surface className="border-y border-line">
            <DetailList
              items={[
                { label: t.tracking.permitNumber, value: delivery.permit.etpNumber, numeric: true },
                { label: t.tracking.quarry, value: delivery.permit.sourceQuarryName },
                { label: t.tracking.destination, value: delivery.permit.destinationLabel },
                {
                  label: t.tracking.permittedQuantity,
                  value: formatQuantity(delivery.permit.permittedQuantity),
                  numeric: true,
                },
                { label: t.tracking.validUntil, value: formatDateTime(delivery.permit.validUntil) },
              ]}
            />
          </Surface>

          {/* ---------- 4. Who is driving ---------- */}
          <SectionHeader title={t.tracking.transporter} />
          <Surface className="border-y border-line">
            <DetailList
              items={[
                { label: t.tracking.transporter, value: delivery.vehicle.transporterName },
                { label: t.tracking.driver, value: delivery.vehicle.driverName },
              ]}
            />
            <div className="space-y-3 px-4 py-3">
              <Button
                variant="secondary"
                fullWidth
                leftIcon={<Phone size={15} />}
                onClick={() => {
                  window.location.href = `tel:${delivery.vehicle.driverMobileNumber}`;
                }}
              >
                {t.tracking.callDriver} · {delivery.vehicle.driverMobileNumber}
              </Button>
              <Button
                variant="secondary"
                fullWidth
                leftIcon={<MapPinned size={15} />}
                onClick={() => navigate(ROUTES.liveVehicleTracking(delivery.id))}
              >
                Track Live Vehicle
              </Button>
            </div>
          </Surface>

          {/* ---------- 5. The authoritative movement record ---------- */}
          <SectionHeader title={t.tracking.movement} />
          <Surface className="border-y border-line px-4 py-4">
            {delivery.tracking.length === 0 ? (
              <p className="py-4 text-center text-body-sm text-ink-muted">
                {t.tracking.noUpdatesBody}
              </p>
            ) : (
              <ol className="space-y-0">
                {[...delivery.tracking].reverse().map((update, index, all) => {
                  const isLatest = index === 0;
                  const isOldest = index === all.length - 1;

                  return (
                    <li key={`${update.at}-${index}`} className="flex gap-3">
                      {/* Timeline rail */}
                      <div className="flex shrink-0 flex-col items-center">
                        {isLatest ? (
                          <CheckCircle2 size={16} className="text-primary-600" aria-hidden />
                        ) : (
                          <Circle size={16} className="text-neutral-300" aria-hidden />
                        )}
                        {!isOldest && <span className="w-px flex-1 bg-line" />}
                      </div>

                      <div className={isOldest ? 'pb-0' : 'pb-5'}>
                        <p className="text-body-sm font-medium text-ink">
                          {statusPresentation.delivery(update.status).label}
                        </p>
                        <p className="mt-0.5 text-body-sm text-ink-secondary">
                          {update.locationLabel}
                        </p>
                        <p className="mt-0.5 text-caption text-ink-muted tabular">
                          {formatDateTime(update.at)}
                        </p>
                        {update.note && (
                          <p className="mt-1 text-caption text-ink-secondary">{update.note}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Surface>
        </div>
      )}
    </Screen>
  );
}

export function LiveVehicleTrackingScreen() {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const t = useCopy();
  const [drawerState, setDrawerState] = useState<'PEEK' | 'HALF' | 'EXPANDED'>('HALF');
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isDigiTpOpen, setIsDigiTpOpen] = useState(false);

  const query = useAsync(async () => {
    if (!deliveryId) throw new Error('A delivery is required');

    const delivery = await deliveryRepository.getById(deliveryId);
    if (!delivery) throw new Error('Delivery not found');

    const minerals = await mineralRepository.listAll();
    return { delivery, minerals };
  }, [deliveryId]);

  const delivery = query.data?.delivery;
  const mineral = query.data?.minerals.find(
    (candidate) => candidate.id === delivery?.permit.mineralId,
  );

  // Drag Gesture Handling
  const handleTouchStart = (clientY: number) => {
    setTouchStartY(clientY);
  };

  const handleTouchEnd = (clientY: number) => {
    if (touchStartY === null) return;
    const deltaY = clientY - touchStartY;
    setTouchStartY(null);

    // Threshold for gesture
    if (deltaY < -35) {
      // Dragged UP -> Expand
      if (drawerState === 'PEEK') setDrawerState('HALF');
      else if (drawerState === 'HALF') setDrawerState('EXPANDED');
    } else if (deltaY > 35) {
      // Dragged DOWN -> Collapse
      if (drawerState === 'EXPANDED') setDrawerState('HALF');
      else if (drawerState === 'HALF') setDrawerState('PEEK');
    }
  };

  const toggleDrawer = () => {
    if (drawerState === 'PEEK') setDrawerState('HALF');
    else if (drawerState === 'HALF') setDrawerState('EXPANDED');
    else setDrawerState('PEEK');
  };

  return (
    <Screen
      title="Live vehicle tracking"
      {...(delivery ? { subtitle: delivery.deliveryNumber } : {})}
      onBack
      className="h-full overflow-hidden p-0"
    >
      {query.loading && <LoadingState variant="list" rows={5} />}
      {query.error && <ErrorState onRetry={query.reload} />}

      {query.data && delivery && (
        <div className="relative h-[calc(100vh-120px)] w-full overflow-hidden bg-neutral-100">
          {/* Background Live Map */}
          <div className="absolute inset-0 z-0">
            <DeliveryLiveMap delivery={delivery} showLabels={false} />
          </div>

          {/* Collapsible & Draggable Bottom Sheet Drawer */}
          <div
            className={cn(
              'absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-[28px] border-t border-x border-neutral-300 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 ease-in-out',
              drawerState === 'PEEK' && 'h-[115px] max-h-[115px]',
              drawerState === 'HALF' && 'h-[48vh] max-h-[48vh]',
              drawerState === 'EXPANDED' && 'h-[86vh] max-h-[86vh]',
            )}
          >
            {/* Draggable Handle and Header (Tap & Drag Area) */}
            <div
              className="touch-none cursor-pointer select-none px-4 pt-2.5 pb-2.5 shrink-0 border-b border-neutral-100 active:bg-neutral-50/80 transition-colors"
              onTouchStart={(e) => handleTouchStart(e.touches[0].clientY)}
              onTouchEnd={(e) => handleTouchEnd(e.changedTouches[0].clientY)}
              onMouseDown={(e) => handleTouchStart(e.clientY)}
              onMouseUp={(e) => handleTouchEnd(e.clientY)}
              onClick={toggleDrawer}
            >
              {/* Central Pill Drag Bar */}
              <div className="flex justify-center pb-2">
                <span className="h-1.5 w-14 rounded-full bg-neutral-300 hover:bg-neutral-400 transition-colors" />
              </div>

              {/* Top Overview Row */}
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-body font-bold text-ink tracking-tight">
                      {delivery.vehicle.registrationNumber}
                    </p>
                    <span className="flex size-2 rounded-full bg-emerald-500 animate-ping" />
                  </div>
                  <p className="text-caption text-neutral-500 font-medium truncate mt-0.5">
                    {mineral?.name} · <span className="tabular">{formatQuantity(delivery.dispatchedQuantity)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge {...statusPresentation.delivery(delivery.status)} />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDrawer();
                    }}
                    className="flex h-8 items-center gap-1 rounded-full bg-neutral-100 px-2.5 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-200 transition-colors"
                  >
                    {drawerState === 'EXPANDED' ? (
                      <>
                        <span>Hide</span>
                        <ChevronDown size={14} />
                      </>
                    ) : drawerState === 'PEEK' ? (
                      <>
                        <span>Expand</span>
                        <ChevronUp size={14} />
                      </>
                    ) : (
                      <>
                        <span>Details</span>
                        <ChevronUp size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Drawer Content (Visible in HALF & EXPANDED states) */}
            {drawerState !== 'PEEK' && (
              <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-6 pt-3 space-y-4">
                {/* Live GPS Telemetry Badge Strip */}
                <div className="flex items-center justify-between rounded-xl bg-neutral-50 border border-neutral-200/80 px-3 py-2 text-[11px] text-neutral-600">
                  <span className="flex items-center gap-1 font-medium">
                    <span className="size-2 rounded-full bg-emerald-500" /> Live GPS: <strong>44 km/h</strong>
                  </span>
                  <span className="text-neutral-400">|</span>
                  <span>ETA: <strong className="text-ink">~35 mins</strong></span>
                  <span className="text-neutral-400">|</span>
                  <span>Battery: <strong className="text-ink">92%</strong></span>
                </div>

                {/* Primary Route Details */}
                <div className="rounded-2xl border border-neutral-100 bg-neutral-50/60 p-3.5 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <span className="mt-1 size-2 rounded-full bg-emerald-600 shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-neutral-400">Dispatch Quarry / Source</p>
                      <p className="text-caption font-semibold text-ink">{delivery.permit.sourceQuarryName}</p>
                    </div>
                  </div>

                  <div className="ml-1 border-l-2 border-dashed border-neutral-200 h-4" />

                  <div className="flex items-start gap-2.5">
                    <span className="mt-1 size-2 rounded-full bg-blue-600 shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-neutral-400">Destination Site</p>
                      <p className="text-caption font-semibold text-ink">{delivery.permit.destinationLabel}</p>
                    </div>
                  </div>
                </div>

                {/* Delivery Driver Details */}
                <DetailList
                  items={[
                    { label: 'Driver Name', value: delivery.vehicle.driverName },
                    { label: 'Driver Mobile', value: delivery.vehicle.driverMobileNumber },
                    { label: 'DigiTP Permit No.', value: delivery.permit.etpNumber, numeric: true },
                    {
                      label: 'Last GPS Ping',
                      value: formatDateTime(
                        delivery.tracking.at(-1)?.at ??
                          delivery.arrivedAt ??
                          delivery.expectedArrivalAt ??
                          delivery.dispatchedAt ??
                          new Date().toISOString(),
                      ),
                    },
                  ]}
                />

                {/* Expanded State: Movement Record Timeline & e-Pass Details */}
                {drawerState === 'EXPANDED' && (
                  <div className="space-y-4 pt-2 border-t border-neutral-100">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-caption font-bold uppercase tracking-wider text-neutral-500">
                          Transit Movement Checkpoints
                        </span>
                        <span className="text-[11px] text-emerald-700 font-bold">Live Tracking</span>
                      </div>

                      <ol className="space-y-0 rounded-2xl border border-neutral-100 bg-neutral-50/50 p-3.5">
                        {[...delivery.tracking].reverse().map((update, index, all) => {
                          const isLatest = index === 0;
                          const isOldest = index === all.length - 1;

                          return (
                            <li key={`${update.at}-${index}`} className="flex gap-3">
                              <div className="flex shrink-0 flex-col items-center">
                                {isLatest ? (
                                  <CheckCircle2 size={16} className="text-emerald-600" aria-hidden />
                                ) : (
                                  <Circle size={16} className="text-neutral-300" aria-hidden />
                                )}
                                {!isOldest && <span className="w-px flex-1 bg-neutral-200" />}
                              </div>

                              <div className={isOldest ? 'pb-0' : 'pb-4'}>
                                <p className="text-caption font-bold text-ink">
                                  {statusPresentation.delivery(update.status).label}
                                </p>
                                <p className="text-[11px] text-neutral-600">{update.locationLabel}</p>
                                <p className="text-[10px] text-neutral-400 tabular">{formatDateTime(update.at)}</p>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    </div>

                    {/* View DigiTP Pass Action Card */}
                    <button
                      type="button"
                      onClick={() => setIsDigiTpOpen(true)}
                      className="flex w-full items-center justify-between rounded-2xl border border-[#bfdbfe] bg-[#eff6ff] p-3 text-caption font-semibold text-[#1d4ed8] hover:bg-blue-100 transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <FileCheck size={16} />
                        <span>View Verified DigiTP Transit Pass</span>
                      </span>
                      <span className="text-caption font-bold">Inspect →</span>
                    </button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex gap-2">
                  <Button
                    variant="primary"
                    fullWidth
                    leftIcon={<Phone size={15} />}
                    onClick={() => {
                      window.location.href = `tel:${delivery.vehicle.driverMobileNumber}`;
                    }}
                  >
                    {t.tracking.callDriver} · {delivery.vehicle.driverMobileNumber}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {delivery && (
        <DigiTpPassModal
          delivery={delivery}
          isOpen={isDigiTpOpen}
          onClose={() => setIsDigiTpOpen(false)}
        />
      )}
    </Screen>
  );
}

function DeliveryLiveMap({
  delivery,
  showLabels = true,
}: {
  delivery: Delivery;
  showLabels?: boolean;
}) {
  const sourceUpdate = delivery.tracking.find((update) => update.geo);
  const latestUpdate = [...delivery.tracking].reverse().find((update) => update.geo);
  const sourceGeo = sourceUpdate?.geo ?? delivery.destination.geo;
  const latestGeo = latestUpdate?.geo ?? delivery.permit.destinationGeo;
  const routePoints: [number, number][] = [
    [sourceGeo.latitude, sourceGeo.longitude],
    ...delivery.tracking
      .filter((update) => update.geo)
      .map((update) => [update.geo!.latitude, update.geo!.longitude] as [number, number]),
    [delivery.permit.destinationGeo.latitude, delivery.permit.destinationGeo.longitude],
  ];

  const center: [number, number] = [
    (sourceGeo.latitude + delivery.permit.destinationGeo.latitude) / 2,
    (sourceGeo.longitude + delivery.permit.destinationGeo.longitude) / 2,
  ];

  return (
    <div className={showLabels ? 'space-y-3' : 'h-full'}>
      <div className={showLabels ? 'h-64 overflow-hidden rounded-xl border border-line bg-neutral-100' : 'h-full overflow-hidden bg-neutral-100'}>
        <MapContainer
          center={center}
          zoom={10}
          scrollWheelZoom={true}
          zoomControl={showLabels ? false : true}
          style={{ height: '100%', width: '100%' }}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polyline
            positions={routePoints}
            pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.8 }}
          />
          <CircleMarker
            center={[sourceGeo.latitude, sourceGeo.longitude]}
            radius={8}
            pathOptions={{ color: '#0f766e', fillColor: '#14b8a6', fillOpacity: 0.9 }}
          />
          <CircleMarker
            center={[latestGeo.latitude, latestGeo.longitude]}
            radius={9}
            pathOptions={{ color: '#1d4ed8', fillColor: '#60a5fa', fillOpacity: 0.95 }}
          />
          <CircleMarker
            center={[delivery.permit.destinationGeo.latitude, delivery.permit.destinationGeo.longitude]}
            radius={8}
            pathOptions={{ color: '#7c3aed', fillColor: '#a78bfa', fillOpacity: 0.9 }}
          />
        </MapContainer>
      </div>

      {showLabels && (
        <div className="flex flex-wrap gap-2 px-1 pb-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-caption font-medium text-emerald-700">
            <span className="size-2 rounded-full bg-emerald-500" />
            {sourceUpdate?.locationLabel ?? delivery.permit.sourceQuarryName}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-caption font-medium text-sky-700">
            <MapPinned size={12} />
            {latestUpdate?.locationLabel ?? 'Current location'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-caption font-medium text-violet-700">
            <span className="size-2 rounded-full bg-violet-500" />
            {delivery.permit.destinationLabel}
          </span>
        </div>
      )}
    </div>
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
