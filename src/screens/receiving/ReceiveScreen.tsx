import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Lock,
  MapPin,
  MapPinned,
  Navigation,
  Phone,
  QrCode,
  Truck,
} from 'lucide-react';
import { formatQuantity, usesOrganizationContext } from '@/rules';
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  SectionHeader,
} from '@/design-system';
import { ROUTES, Screen } from '@/navigation';
import { deliveryRepository, mineralRepository, useAsync } from '@/data';
import { useCurrentUser, useOperatingContext } from '@/state';
import { useCopy } from '@/content';

export function ReceiveScreen() {
  const user = useCurrentUser();
  const context = useOperatingContext();
  const navigate = useNavigate();
  const t = useCopy();

  const query = useAsync(async () => {
    if (!user) throw new Error('A session is required');

    const allDeliveries = usesOrganizationContext(user.userType)
      ? await deliveryRepository.list({
          ...(context?.organizationId ? { organizationId: context.organizationId } : {}),
        })
      : await deliveryRepository.listForUser(user.id);

    // Active deliveries include both arrived and in-transit/dispatched
    const activeDeliveries = allDeliveries.filter(
      (delivery) =>
        delivery.status === 'ARRIVED_AT_DESTINATION' ||
        delivery.status === 'IN_TRANSIT' ||
        delivery.status === 'DISPATCHED'
    );

    const minerals = await mineralRepository.listAll();
    return { deliveries: activeDeliveries, minerals };
  }, [user?.id, context?.organizationId]);

  const minerals = query.data?.minerals ?? [];
  const deliveries = query.data?.deliveries ?? [];

  const arrivedDeliveries = deliveries.filter(
    (d) => d.status === 'ARRIVED_AT_DESTINATION'
  );
  const inTransitDeliveries = deliveries.filter(
    (d) => d.status === 'IN_TRANSIT' || d.status === 'DISPATCHED'
  );

  const primaryTargetDelivery = arrivedDeliveries[0] || inTransitDeliveries[0];

  return (
    <Screen title={t.receiving.title} onBack>
      {query.loading && <LoadingState variant="list" rows={3} />}
      {query.error && <ErrorState onRetry={query.reload} />}

      {query.data && (
        <div className="space-y-5 bg-[#f8fafc] px-4 py-4 pb-12">
          {/* 1. Quick QR Scan Card */}
          <div className="rounded-2xl border border-[#d6e5f8] bg-white p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-[#eef4fe] text-[#1241a6]">
                <QrCode size={22} />
              </span>
              <div>
                <h2 className="text-body font-bold text-ink">Scan DigiTP Transit Pass</h2>
                <p className="mt-0.5 text-caption text-neutral-500">
                  Point camera at the driver's QR code to verify & receive
                </p>
              </div>
            </div>

            <div className="mt-4">
              <Button
                variant="primary"
                fullWidth
                size="lg"
                leftIcon={<QrCode size={18} />}
                onClick={() => {
                  if (primaryTargetDelivery) {
                    navigate(ROUTES.receiveDelivery(primaryTargetDelivery.id));
                  } else {
                    navigate(ROUTES.receiveDelivery('del-004'));
                  }
                }}
              >
                Open QR Scanner
              </Button>
            </div>
          </div>

          {/* 2. Vehicles Arrived at Site Gate (Ready for Immediate Receiving) */}
          {arrivedDeliveries.length > 0 && (
            <div>
              <SectionHeader
                title="Vehicles at Site Gate (Ready to Receive)"
                description="The following vehicles have reached your site geofence and are waiting to be unloaded."
              />

              <div className="space-y-3">
                {arrivedDeliveries.map((delivery) => {
                  const mineral = minerals.find((m) => m.id === delivery.permit.mineralId);

                  return (
                    <div
                      key={delivery.id}
                      className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                            <CheckCircle2 size={16} />
                          </span>
                          <div>
                            <span className="font-mono text-body-sm font-bold text-ink">
                              {delivery.vehicle.registrationNumber}
                            </span>
                            <p className="text-[11px] font-medium text-emerald-700">
                              At Site Gate · Ready to Offload
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-caption font-bold text-emerald-800">
                          Arrived
                        </span>
                      </div>

                      <div className="mt-3 flex items-baseline justify-between rounded-xl bg-white p-2.5 text-caption border border-emerald-100">
                        <div>
                          <span className="text-neutral-500 font-medium">Mineral: </span>
                          <span className="font-semibold text-ink">{mineral?.name || 'Basalt Stone'}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500 font-medium">Dispatched Qty: </span>
                          <span className="tabular font-bold text-ink">
                            {formatQuantity(delivery.dispatchedQuantity)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <Button
                          variant="primary"
                          fullWidth
                          leftIcon={<QrCode size={16} />}
                          onClick={() => navigate(ROUTES.receiveDelivery(delivery.id))}
                        >
                          Verify & Receive Material
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. In-Transit Vehicles En Route */}
          {inTransitDeliveries.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <SectionHeader
                  title="Vehicles In Transit (En Route)"
                  description="Trucks currently moving toward your site location."
                />
              </div>

              <div className="space-y-3">
                {inTransitDeliveries.map((delivery) => {
                  const mineral = minerals.find((m) => m.id === delivery.permit.mineralId);

                  return (
                    <div
                      key={delivery.id}
                      className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 items-center justify-center rounded-lg bg-[#eef4fe] text-[#1241a6]">
                            <Truck size={16} />
                          </span>
                          <div>
                            <p className="font-mono text-body-sm font-bold text-ink">
                              {delivery.vehicle.registrationNumber}
                            </p>
                            <p className="text-[11px] font-medium text-neutral-500">
                              DigiTP: {delivery.permit.etpNumber || 'DTP-2024-8842'}
                            </p>
                          </div>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-[#f4eafc] px-2.5 py-0.5 text-caption font-semibold text-[#7e22ce]">
                          In Transit
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-baseline justify-between rounded-xl bg-neutral-50 px-3 py-1.5 text-caption">
                        <span className="font-semibold text-ink">
                          {mineral?.name || 'River Sand'}
                        </span>
                        <span className="tabular font-bold text-ink">
                          {formatQuantity(delivery.dispatchedQuantity)}
                        </span>
                      </div>

                      {/* Distance & ETA */}
                      <div className="mt-3 space-y-1.5 rounded-xl bg-neutral-50 p-3 text-caption">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-neutral-600 font-medium">
                            <Navigation size={13} className="text-[#1241a6]" />
                            Distance & ETA:
                          </span>
                          <span className="font-semibold text-ink">~4.2 km away (15 mins)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-neutral-600 font-medium">
                            <MapPin size={13} className="text-neutral-500" />
                            Destination:
                          </span>
                          <span className="font-semibold text-ink truncate max-w-[180px]">
                            {delivery.destination.label}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-neutral-600 font-medium">
                            <Phone size={13} className="text-neutral-500" />
                            Driver:
                          </span>
                          <span className="font-semibold text-ink">
                            {delivery.vehicle.driverName} ({delivery.vehicle.driverMobileNumber})
                          </span>
                        </div>
                      </div>

                      {/* Lock Info Box */}
                      <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-2.5 text-caption text-amber-900">
                        <Lock size={15} className="mt-0.5 shrink-0 text-amber-600" />
                        <span className="text-[12px] leading-snug">
                          <strong>Receiving locked in transit.</strong> Unlocks automatically once the vehicle enters within 200m of the site geofence.
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          fullWidth
                          leftIcon={<MapPinned size={14} />}
                          onClick={() => navigate(ROUTES.liveVehicleTracking(delivery.id))}
                        >
                          Track Vehicle
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          fullWidth
                          leftIcon={<QrCode size={14} />}
                          onClick={() => navigate(ROUTES.receiveDelivery(delivery.id))}
                        >
                          Scan & Receive
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Empty State if zero active deliveries */}
          {deliveries.length === 0 && (
            <EmptyState
              icon={<Truck size={24} />}
              title="No Active Mineral Deliveries"
              description="There are currently no vehicles in transit or waiting at your sites."
              action={
                <Button onClick={() => navigate(ROUTES.stockPoints)}>
                  Find Mineral Places
                </Button>
              }
            />
          )}
        </div>
      )}
    </Screen>
  );
}
