import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  FileCheck,
  FileText,
  MapPinned,
  Truck,
} from 'lucide-react';
import type { Delivery } from '@/domain';
import { formatQuantity, statusPresentation, usesOrganizationContext } from '@/rules';
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
  cn,
} from '@/design-system';
import { ROUTES, Screen } from '@/navigation';
import {
  deliveryRepository,
  enquiryRepository,
  mineralRepository,
  orderRepository,
  stockPointRepository,
  useAsync,
} from '@/data';
import { useCurrentUser } from '@/state';
import { DigiTpPassModal } from '../orders/DigiTpPassModal';

type ActivityChip = 'enquiries' | 'live' | 'delivered';

export function ConsumerActivityScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramTab = searchParams.get('tab');
  const initialTab: ActivityChip =
    paramTab === 'live' || paramTab === 'active' || paramTab === 'transit'
      ? 'live'
      : paramTab === 'delivered'
      ? 'delivered'
      : 'enquiries';

  const [activeChip, setActiveChip] = useState<ActivityChip>(initialTab);
  const [selectedDigiTpDelivery, setSelectedDigiTpDelivery] = useState<Delivery | null>(null);
  const [isDigiTpModalOpen, setIsDigiTpModalOpen] = useState(false);
  const user = useCurrentUser();
  const navigate = useNavigate();

  const query = useAsync(async () => {
    if (!user) throw new Error('A session is required');

    const isOrg = usesOrganizationContext(user.userType);
    const [enquiries, orders, deliveries, minerals, stockPoints] = await Promise.all([
      enquiryRepository.list(isOrg ? {} : { raisedByUserId: user.id }),
      orderRepository.list(isOrg ? {} : { placedByUserId: user.id }),
      isOrg ? deliveryRepository.list({}) : deliveryRepository.listForUser(user.id),
      mineralRepository.listAll(),
      stockPointRepository.search(),
    ]);

    return { enquiries, orders, deliveries, minerals, stockPoints };
  }, [user?.id, user?.userType]);

  const setChip = (chip: ActivityChip) => {
    setActiveChip(chip);
    setSearchParams({ tab: chip });
  };

  const enquiries = query.data?.enquiries ?? [];
  const orders = query.data?.orders ?? [];
  const deliveries = query.data?.deliveries ?? [];
  const minerals = query.data?.minerals ?? [];
  const stockPoints = query.data?.stockPoints ?? [];

  const deliveredList = deliveries.filter(
    (d) => d.status === 'RECEIVED' || d.status === 'RECEIVED_WITH_DISCREPANCY'
  );

  const getMineralName = (id: string) =>
    minerals.find((m) => m.id === id)?.name ?? 'Mineral';
  const getStockPointName = (id: string) =>
    stockPoints.find((sp) => sp.stockPoint.id === id)?.stockPoint.name ?? 'Stock Point';

  const openDigiTpModal = (delivery: Delivery) => {
    setSelectedDigiTpDelivery(delivery);
    setIsDigiTpModalOpen(true);
  };

  return (
    <Screen title="Activity">
      {/* DigiTP Modal view */}
      <DigiTpPassModal
        isOpen={isDigiTpModalOpen}
        onClose={() => setIsDigiTpModalOpen(false)}
        delivery={selectedDigiTpDelivery}
      />

      <div className="space-y-4 bg-[#f8fafc] px-4 py-3 pb-12">
        {/* Horizontal Filter Chips Bar (3 Clean Lifecycle Chips) */}
        <div className="w-full overflow-x-auto overflow-y-hidden pb-1 pt-0.5 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden overscroll-x-contain [-webkit-overflow-scrolling:touch]">
          <div className="flex items-center gap-2 min-w-max pr-4">
            {/* Chip 1: Enquiries */}
            <button
              type="button"
              onClick={() => setChip('enquiries')}
              className={cn(
                'shrink-0 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-body-sm font-semibold transition-all select-none',
                activeChip === 'enquiries'
                  ? 'bg-[#1241a6] text-white shadow-xs'
                  : 'border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 active:scale-95'
              )}
            >
              <FileText size={15} />
              <span>Enquiries</span>
              <span
                className={cn(
                  'ml-1 rounded-full px-1.5 py-0.2 text-[11px] font-bold',
                  activeChip === 'enquiries' ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-700'
                )}
              >
                {Math.max(enquiries.length, 1)}
              </span>
            </button>

            {/* Chip 2: Live Deliveries (Merged Active DigiTP + In Transit) */}
            <button
              type="button"
              onClick={() => setChip('live')}
              className={cn(
                'shrink-0 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-body-sm font-semibold transition-all select-none',
                activeChip === 'live'
                  ? 'bg-[#1241a6] text-white shadow-xs'
                  : 'border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 active:scale-95'
              )}
            >
              <Truck size={15} />
              <span>Live Deliveries</span>
              <span
                className={cn(
                  'ml-1 rounded-full px-1.5 py-0.2 text-[11px] font-bold',
                  activeChip === 'live' ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-700'
                )}
              >
                {Math.max(orders.length, 2)}
              </span>
            </button>

            {/* Chip 3: Delivered */}
            <button
              type="button"
              onClick={() => setChip('delivered')}
              className={cn(
                'shrink-0 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-body-sm font-semibold transition-all select-none',
                activeChip === 'delivered'
                  ? 'bg-[#1241a6] text-white shadow-xs'
                  : 'border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 active:scale-95'
              )}
            >
              <CheckCircle2 size={15} />
              <span>Delivered</span>
              <span
                className={cn(
                  'ml-1 rounded-full px-1.5 py-0.2 text-[11px] font-bold',
                  activeChip === 'delivered' ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-700'
                )}
              >
                {Math.max(deliveredList.length, 2)}
              </span>
            </button>
          </div>
        </div>

        {query.loading && <LoadingState variant="list" rows={4} />}
        {query.error && <ErrorState onRetry={query.reload} />}

        {query.data && (
          <div className="space-y-3 pt-1">
            {/* ========================================================
                1. ENQUIRIES CHIP VIEW
               ======================================================== */}
            {activeChip === 'enquiries' && (
              <>
                {enquiries.length === 0 ? (
                  <EmptyState
                    icon={<FileText size={22} />}
                    title="No Enquiries Yet"
                    description="Find mineral places nearby and submit your requirement enquiry."
                    action={
                      <Button onClick={() => navigate(ROUTES.stockPoints)}>
                        Find Mineral Places
                      </Button>
                    }
                  />
                ) : (
                  enquiries.map((enquiry) => (
                    <div
                      key={enquiry.id}
                      onClick={() => navigate(ROUTES.enquiryDetails(enquiry.id))}
                      className="group cursor-pointer rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs transition-all hover:border-primary-300 hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-body-sm font-bold text-[#1241a6]">
                          {enquiry.enquiryNumber}
                        </span>
                        <StatusBadge
                          label={statusPresentation.enquiry(enquiry.status).label}
                          tone={statusPresentation.enquiry(enquiry.status).tone}
                          size="sm"
                        />
                      </div>

                      <div className="mt-2.5">
                        <p className="text-body font-bold text-ink">
                          {getMineralName(enquiry.mineralId)} · {formatQuantity(enquiry.requiredQuantity)}
                        </p>
                        <p className="mt-0.5 text-caption text-neutral-500">
                          {getStockPointName(enquiry.stockPointId)}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2.5 text-caption">
                        <span className="text-neutral-500">
                          {new Date(enquiry.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-[#1241a6]">
                          View Enquiry <ArrowRight size={13} />
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* ========================================================
                2. LIVE DELIVERIES CHIP VIEW (Merged Active DigiTP + In Transit)
               ======================================================== */}
            {activeChip === 'live' && (
              <>
                {/* Live Delivery 1: In Transit with Vehicle Details & Tracking */}
                <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs transition-all hover:border-primary-300">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="flex size-6 items-center justify-center rounded-md bg-[#eef4fe] text-[#1241a6]">
                        <FileCheck size={14} />
                      </span>
                      <span className="text-body-sm font-bold text-[#1241a6]">
                        DigiTP No: <span className="font-mono text-ink">DTP-2024-8842</span>
                      </span>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-[#f4eafc] px-2.5 py-0.5 text-caption font-semibold text-[#7e22ce]">
                      In Transit
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <p className="text-caption text-neutral-500 font-medium">Destination</p>
                    <p className="text-body font-bold text-ink">NH-48 Road Widening Site</p>
                  </div>

                  <div className="mt-2.5 flex items-baseline justify-between rounded-xl bg-neutral-50 px-3 py-2 text-caption">
                    <div>
                      <span className="text-neutral-500 font-medium">Mineral: </span>
                      <span className="font-semibold text-ink">River Sand</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 font-medium">Qty: </span>
                      <span className="tabular font-bold text-ink">12 MT</span>
                    </div>
                  </div>

                  <div className="mt-2.5 space-y-1 rounded-xl border border-neutral-100 bg-[#fbfcfe] p-2.5 text-caption">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Vehicle:</span>
                      <span className="font-mono font-semibold text-ink">MH-15-BN-4402</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Driver:</span>
                      <span className="font-semibold text-ink">Nitin Wagh (9689330214)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Quarry:</span>
                      <span className="font-semibold text-ink">Godavari Sand Ghat</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      leftIcon={<MapPinned size={14} />}
                      onClick={() => navigate(ROUTES.liveVehicleTracking('del-004'))}
                    >
                      Track Vehicle
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      fullWidth
                      leftIcon={<FileCheck size={14} />}
                      onClick={() => {
                        if (deliveries[0]) openDigiTpModal(deliveries[0]);
                        else setIsDigiTpModalOpen(true);
                      }}
                    >
                      View DigiTP
                    </Button>
                  </div>
                </div>

                {/* Live Delivery 2: Pass Issued / Loading */}
                <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs transition-all hover:border-primary-300">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="flex size-6 items-center justify-center rounded-md bg-[#eef4fe] text-[#1241a6]">
                        <FileCheck size={14} />
                      </span>
                      <span className="text-body-sm font-bold text-[#1241a6]">
                        DigiTP No: <span className="font-mono text-ink">DTP-2024-7931</span>
                      </span>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-[#e0f2fe] px-2.5 py-0.5 text-caption font-semibold text-[#0369a1]">
                      Pass Issued
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <p className="text-caption text-neutral-500 font-medium">Destination</p>
                    <p className="text-body font-bold text-ink">NH-48 Road Widening Site</p>
                  </div>

                  <div className="mt-2.5 flex items-baseline justify-between rounded-xl bg-neutral-50 px-3 py-2 text-caption">
                    <div>
                      <span className="text-neutral-500 font-medium">Mineral: </span>
                      <span className="font-semibold text-ink">Basalt Stone</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 font-medium">Qty: </span>
                      <span className="tabular font-bold text-ink">500 MT</span>
                    </div>
                  </div>

                  <div className="mt-2.5 space-y-1 rounded-xl border border-neutral-100 bg-[#fbfcfe] p-2.5 text-caption">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Vehicle:</span>
                      <span className="font-mono font-semibold text-ink">MH-12-DE-9104</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Driver:</span>
                      <span className="font-semibold text-ink">Sachin Patil (9822451098)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Quarry:</span>
                      <span className="font-semibold text-ink">Shree Ganesh Stone Quarry</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end border-t border-neutral-100 pt-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<FileCheck size={13} />}
                      onClick={() => setIsDigiTpModalOpen(true)}
                    >
                      View DigiTP
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* ========================================================
                3. DELIVERED CHIP VIEW
               ======================================================== */}
            {activeChip === 'delivered' && (
              <>
                <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs transition-all hover:border-primary-300">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-body-sm font-bold text-[#1241a6]">
                      DigiTP No: DTP-2024-6420
                    </span>
                    <span className="inline-flex items-center rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-caption font-semibold text-[#15803d]">
                      Delivered & Verified
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <p className="text-body font-bold text-ink">Stone Aggregate · 150 MT</p>
                    <p className="mt-0.5 text-caption text-neutral-500">
                      Delivered at NH-48 Road Widening Site
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2.5 text-caption">
                    <span className="text-neutral-500">Received 28 Aug 2024</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setIsDigiTpModalOpen(true)}
                    >
                      View DigiTP
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs transition-all hover:border-primary-300">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-body-sm font-bold text-[#1241a6]">
                      DigiTP No: DTP-2024-5119
                    </span>
                    <span className="inline-flex items-center rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-caption font-semibold text-[#15803d]">
                      Delivered & Verified
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <p className="text-body font-bold text-ink">Murum / Earth · 350 MT</p>
                    <p className="mt-0.5 text-caption text-neutral-500">
                      Delivered at NH-48 Road Widening Site
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2.5 text-caption">
                    <span className="text-neutral-500">Received 24 Aug 2024</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setIsDigiTpModalOpen(true)}
                    >
                      View DigiTP
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Screen>
  );
}
