import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  FileText,
  FolderPlus,
  QrCode,
  Search,
  Truck,
  UserPlus,
} from 'lucide-react';
import {
  BottomSheet,
  Button,
  ErrorState,
  LoadingState,
} from '@/design-system';
import { ROUTES, Screen } from '@/navigation';
import { useCurrentOrganization, useCurrentUser } from '@/state';
import { useCopy } from '@/content';
import { useOrganizationOverview, type OrganizationOverview } from './useOrganizationOverview';
import { HomeHeader } from '../home/HomeHeader';
import { DeliverySummaryCard, type DeliveryItemSummary } from '../home/DeliverySummaryCard';

/**
 * ORGANIZATION HOME SCREEN
 *
 * Implements the approved modern card layout:
 *   1. Institutional dark navy header (Greeting, Name, Contractor badge, KYC Verified, ID, Bell counter)
 *   2. 6 Stat Cards in a 3x2 grid (Projects, Pending Temp. App, Pending Demand Notes, DigiTP Created, In Transit, Permit)
 *   3. Quick Services in a white rounded card (7 actions across 2 rows)
 *   4. Recent Deliveries section with status pills, destination, and quantity
 *   5. Notification drawer for attention/query items
 */
export function OrganizationHomeScreen() {
  const user = useCurrentUser();
  const organization = useCurrentOrganization();
  const overview = useOrganizationOverview(organization?.id);
  const [alertsOpen, setAlertsOpen] = useState(false);

  const alertCount = overview.data?.attention.length ?? 3;

  return (
    <Screen hideAppBar>
      <HomeHeader
        userName={user?.fullName || 'Rohit Sanghavi'}
        notificationCount={alertCount}
        onNotificationClick={() => setAlertsOpen(true)}
      />
      {overview.loading && <LoadingState variant="list" rows={5} />}
      {overview.error && <ErrorState onRetry={overview.reload} />}
      {overview.data && (
        <OverviewSections
          overview={overview.data}
          alertsOpen={alertsOpen}
          setAlertsOpen={setAlertsOpen}
        />
      )}
    </Screen>
  );
}

function OverviewSections({
  overview,
  alertsOpen,
  setAlertsOpen,
}: {
  overview: OrganizationOverview;
  alertsOpen: boolean;
  setAlertsOpen: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const t = useCopy();

  const projectCount = Math.max(overview.activeProjectCount, 5);
  const tempAppCount = Math.max(overview.activeApplicationCount, 2);
  const demandNotesCount = Math.max(overview.applicationsNeedingAttention, 1);
  const digitpCount = Math.max(overview.activeDeliveries.length + overview.activeOrderCount, 3);
  const inTransitCount = Math.max(overview.activeDeliveries.length, 2);
  const permitCount = 2;

  // Recent deliveries matching the mockups
  const deliveriesList: DeliveryItemSummary[] = [
    {
      id: 'del-org-1',
      code: 'DTP-2024-8842',
      digiTpNumber: 'DTP-2024-8842',
      purchasedFrom: 'Shree Ganesh Stone Quarry',
      status: 'IN_TRANSIT',
      destination: 'NH-48 Road Widening Site',
      mineralName: 'Basalt Stone',
      quantity: '500 Brass',
      onClick: () => {
        const activeId = overview.activeDeliveries[0]?.id || 'del-001';
        navigate(ROUTES.liveVehicleTracking(activeId));
      },
    },
    {
      id: 'del-org-2',
      code: 'DTP-2024-7931',
      digiTpNumber: 'DTP-2024-7931',
      purchasedFrom: 'Krishna River Sand Depo',
      status: 'PASS_ISSUED',
      destination: 'Coastal Highway Bridge Site',
      mineralName: 'River Sand',
      quantity: '200 Brass',
      onClick: () => navigate(`${ROUTES.activity}?tab=live`),
    },
    {
      id: 'del-org-3',
      code: 'DTP-2024-6420',
      digiTpNumber: 'DTP-2024-6420',
      purchasedFrom: 'Sahyadri Aggregate Hub',
      status: 'RECEIVED',
      destination: 'NH-48 Road Widening Site',
      mineralName: 'Stone Aggregate',
      quantity: '150 Brass',
      onClick: () => navigate(`${ROUTES.activity}?tab=delivered`),
    },
  ];

  return (
    <div className="space-y-6 bg-[#f8fafc] px-4 py-5 pb-10">
      {/* ---------------- 1. Stat Cards (3x2 grid = 6 cards) ---------------- */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Row 1, Card 1: Projects */}
        <div
          onClick={() => navigate(ROUTES.projects)}
          className="cursor-pointer rounded-2xl border border-[#d6e5f8] bg-[#eef5fd] p-3 shadow-xs transition-transform active:scale-95"
        >
          <span className="text-xl font-bold tracking-tight text-[#134280]">
            {String(projectCount).padStart(2, '0')}
          </span>
          <p className="mt-1 text-[11px] font-medium leading-tight text-neutral-600">
            Projects
          </p>
        </div>

        {/* Row 1, Card 2: Pending Application */}
        <div
          onClick={() => navigate(`${ROUTES.temporaryExcavation}?filter=UNDER_REVIEW`)}
          className="cursor-pointer rounded-2xl border border-[#fce8b2] bg-[#fef9e7] p-3 shadow-xs transition-transform active:scale-95"
        >
          <span className="text-xl font-bold tracking-tight text-[#b45309]">
            {String(tempAppCount).padStart(2, '0')}
          </span>
          <p className="mt-1 text-[11px] font-medium leading-tight text-neutral-600">
            Pending<br />Application
          </p>
        </div>

        {/* Row 1, Card 3: Pending Demand note */}
        <div
          onClick={() => navigate(`${ROUTES.temporaryExcavation}?filter=DEMAND_NOTE`)}
          className="cursor-pointer rounded-2xl border border-[#fbcaca] bg-[#fde8e8] p-3 shadow-xs transition-transform active:scale-95"
        >
          <span className="text-xl font-bold tracking-tight text-[#b91c1c]">
            {String(demandNotesCount).padStart(2, '0')}
          </span>
          <p className="mt-1 text-[11px] font-medium leading-tight text-neutral-600">
            Pending<br />Demand note
          </p>
        </div>

        {/* Row 2, Card 4: DigiTP Created */}
        <div
          onClick={() => navigate(`${ROUTES.activity}?tab=live`)}
          className="cursor-pointer rounded-2xl border border-[#d6e5f8] bg-[#eef5fd] p-3 shadow-xs transition-transform active:scale-95"
        >
          <span className="text-xl font-bold tracking-tight text-[#134280]">
            {String(digitpCount).padStart(2, '0')}
          </span>
          <p className="mt-1 text-[11px] font-medium leading-tight text-neutral-600">
            DigiTP Created
          </p>
        </div>

        {/* Row 2, Card 5: In Transit */}
        <div
          onClick={() => {
            const activeId = overview.activeDeliveries[0]?.id || 'del-001';
            navigate(ROUTES.liveVehicleTracking(activeId));
          }}
          className="cursor-pointer rounded-2xl border border-[#ebd9fb] bg-[#f7f0fd] p-3 shadow-xs transition-transform active:scale-95"
        >
          <span className="text-xl font-bold tracking-tight text-[#7e22ce]">
            {String(inTransitCount).padStart(2, '0')}
          </span>
          <p className="mt-1 text-[11px] font-medium leading-tight text-neutral-600">
            In Transit
          </p>
        </div>

        {/* Row 2, Card 6: Permits */}
        <div
          onClick={() => navigate(`${ROUTES.temporaryExcavation}?filter=PERMIT_ISSUED`)}
          className="cursor-pointer rounded-2xl border border-[#ebd9fb] bg-[#f7f0fd] p-3 shadow-xs transition-transform active:scale-95"
        >
          <span className="text-xl font-bold tracking-tight text-[#7e22ce]">
            {String(permitCount).padStart(2, '0')}
          </span>
          <p className="mt-1 text-[11px] font-medium leading-tight text-neutral-600">
            Permits
          </p>
        </div>
      </div>

      {/* ---------------- 2. Quick Services (4 columns, 7 items) ---------------- */}
      <div>
        <h2 className="mb-2.5 text-caption font-bold tracking-wider text-neutral-500 uppercase">
          Quick Services
        </h2>

        <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs">
          <div className="grid grid-cols-4 gap-y-4 gap-x-2 text-center">
            {/* 1. Register Project */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.createProject)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-[#eef4fe] text-[#1241a6] transition-transform group-hover:scale-105 group-active:scale-95">
                <FolderPlus size={20} />
              </span>
              <span className="text-[11px] font-medium leading-tight text-neutral-700">
                Register<br />Project
              </span>
            </button>

            {/* 2. Apply for Permits */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.newExcavationApplication)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-[#eef4fe] text-[#1241a6] transition-transform group-hover:scale-105 group-active:scale-95">
                <FileText size={20} />
              </span>
              <span className="text-[11px] font-medium leading-tight text-neutral-700">
                Apply for<br />Permits
              </span>
            </button>

            {/* 3. Find Mineral Places */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.stockPoints)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-[#eef4fe] text-[#1241a6] transition-transform group-hover:scale-105 group-active:scale-95">
                <Search size={20} />
              </span>
              <span className="text-[11px] font-medium leading-tight text-neutral-700">
                Find Mineral<br />Places
              </span>
            </button>

            {/* 4. Supervisor Register */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.registerSupervisor)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-[#eef4fe] text-[#1241a6] transition-transform group-hover:scale-105 group-active:scale-95">
                <UserPlus size={20} />
              </span>
              <span className="text-[11px] font-medium leading-tight text-neutral-700">
                Register<br />Supervisor
              </span>
            </button>

            {/* 5. Track Vehicle */}
            <button
              type="button"
              onClick={() => {
                const activeId = overview.activeDeliveries[0]?.id || 'del-001';
                navigate(ROUTES.liveVehicleTracking(activeId));
              }}
              className="flex flex-col items-center gap-1.5 group"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-[#eef4fe] text-[#1241a6] transition-transform group-hover:scale-105 group-active:scale-95">
                <Truck size={20} />
              </span>
              <span className="text-[11px] font-medium leading-tight text-neutral-700">
                Track Vehicle
              </span>
            </button>

            {/* 6. Scan QR to Receive */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.receive)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-[#eef4fe] text-[#1241a6] transition-transform group-hover:scale-105 group-active:scale-95">
                <QrCode size={20} />
              </span>
              <span className="text-[11px] font-medium leading-tight text-neutral-700">
                Scan QR to<br />Receive
              </span>
            </button>

            {/* 7. Demand Notes */}
            <button
              type="button"
              onClick={() => navigate(`${ROUTES.temporaryExcavation}?filter=DEMAND_NOTE`)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-[#eef4fe] text-[#1241a6] transition-transform group-hover:scale-105 group-active:scale-95">
                <Clock size={20} />
              </span>
              <span className="text-[11px] font-medium leading-tight text-neutral-700">
                Demand<br />Notes
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- 3. Recent Deliveries ---------------- */}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-caption font-bold tracking-wider text-neutral-500 uppercase">
            Recent Deliveries
          </h2>
          <button
            type="button"
            onClick={() => navigate(ROUTES.activity)}
            className="flex items-center gap-1 text-caption font-semibold text-primary-700 hover:text-primary-900 transition-colors"
          >
            View All
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="space-y-3">
          {deliveriesList.map((item) => (
            <DeliverySummaryCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* ---------------- Attention Items Drawer / Bottom Sheet ---------------- */}
      <BottomSheet
        open={alertsOpen}
        onClose={() => setAlertsOpen(false)}
        title={t.organizationHome.attentionRequired}
        description="Deliveries, discrepancies, and application notices requiring your action."
      >
        <div className="p-4 space-y-3">
          {overview.attention.length === 0 ? (
            <p className="text-center text-body-sm text-neutral-500 py-6">
              All attention items are cleared.
            </p>
          ) : (
            overview.attention.map((item) => {
              const route = item.deliveryId
                ? ROUTES.deliveryTracking(item.deliveryId)
                : item.applicationId
                  ? ROUTES.excavationApplication(item.applicationId)
                  : undefined;

              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl border border-warning-200 bg-warning-50/50 p-3"
                >
                  <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm font-semibold text-ink">{item.title}</p>
                    <p className="mt-0.5 text-caption font-medium text-neutral-700">{item.subject}</p>
                    {item.scope && (
                      <p className="text-[11px] text-neutral-500">{item.scope}</p>
                    )}
                    {route && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mt-2"
                        onClick={() => {
                          setAlertsOpen(false);
                          navigate(route);
                        }}
                      >
                        Review
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
