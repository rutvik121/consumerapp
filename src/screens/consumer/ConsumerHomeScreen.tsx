import { useNavigate } from 'react-router-dom';
import { ArrowRight, FolderPlus, QrCode, Search, Truck } from 'lucide-react';
import type { Delivery, Enquiry, Mineral, Order, Project, Quantity } from '@/domain';
import {
  isDeliveryActive,
  primaryAvailable,
} from '@/rules';
import {
  ErrorState,
  LoadingState,
} from '@/design-system';
import { ROUTES, Screen } from '@/navigation';
import {
  deliveryRepository,
  enquiryRepository,
  inventoryRepository,
  mineralRepository,
  orderRepository,
  projectRepository,
  useAsync,
} from '@/data';
import { useCurrentUser } from '@/state';
import { HomeHeader } from '../home/HomeHeader';
import { DeliverySummaryCard, type DeliveryItemSummary } from '../home/DeliverySummaryCard';

interface ConsumerHomeData {
  activeDeliveries: Delivery[];
  enquiries: Enquiry[];
  orders: Order[];
  available: Quantity | null;
  minerals: Mineral[];
  projects: Project[];
}

/**
 * INDIVIDUAL / NORMAL CONSUMER HOME SCREEN
 *
 * Implements the approved modern card layout:
 *   1. Institutional dark navy header (Greeting, Name, Role, KYC Verified, ID, Notifications)
 *   2. 3 Stat cards (Projects, DigiTP Created, In Transit)
 *   3. Quick Services in a white rounded card (4 actions)
 *   4. Recent Deliveries section with status pills, destination, and quantity
 */
export function ConsumerHomeScreen() {
  const user = useCurrentUser();

  const query = useAsync(async () => {
    if (!user) throw new Error('A session is required');

    const [deliveries, enquiries, orders, balances, minerals, projects] = await Promise.all([
      deliveryRepository.listForUser(user.id),
      enquiryRepository.list({ raisedByUserId: user.id }),
      orderRepository.list({ placedByUserId: user.id }),
      inventoryRepository.list({ userId: user.id }),
      mineralRepository.listAll(),
      projectRepository.listForConsumer(user.id),
    ]);

    return {
      activeDeliveries: deliveries.filter(isDeliveryActive),
      enquiries,
      orders,
      available: primaryAvailable(balances),
      minerals,
      projects,
    } satisfies ConsumerHomeData;
  }, [user?.id]);

  return (
    <Screen hideAppBar>
      <HomeHeader
        userName={user?.fullName || 'Rohit Sanghavi'}
        notificationCount={4}
      />
      {query.loading && <LoadingState variant="list" rows={4} />}
      {query.error && <ErrorState onRetry={query.reload} />}
      {query.data && <ConsumerHomeContent data={query.data} />}
    </Screen>
  );
}

function ConsumerHomeContent({ data }: { data: ConsumerHomeData }) {
  const navigate = useNavigate();

  const projectCount = data.projects.length;
  const digitpCount = data.activeDeliveries.length;
  const inTransitCount = data.activeDeliveries.filter((d) => d.status === 'IN_TRANSIT').length || 1;

  // Map real deliveries or provide realistic prototype preview deliveries matching the design
  const deliveriesList: DeliveryItemSummary[] = [
    {
      id: 'del-demo-1',
      code: 'DTP-2024-8842',
      digiTpNumber: 'DTP-2024-8842',
      purchasedFrom: 'Shree Ganesh Stone Quarry',
      status: 'IN_TRANSIT',
      destination: 'NH-48 Road Widening Site',
      mineralName: 'Basalt Stone',
      quantity: '500 Brass',
      onClick: () => {
        const id = data.activeDeliveries[0]?.id || 'del-004';
        navigate(ROUTES.liveVehicleTracking(id));
      },
    },
    {
      id: 'del-demo-2',
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
      id: 'del-demo-3',
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
      {/* ---------------- 1. Stat Cards (3 columns) ---------------- */}
      <div className="grid grid-cols-3 gap-3">
        {/* Projects (1) -> Lands on Registered Consumer Projects */}
        <div
          onClick={() => navigate(ROUTES.consumerProjects)}
          className="cursor-pointer rounded-2xl border border-[#d6e5f8] bg-[#eef5fd] p-3.5 shadow-xs transition-transform active:scale-95"
        >
          <span className="text-2xl font-bold tracking-tight text-[#134280]">
            {String(projectCount).padStart(2, '0')}
          </span>
          <p className="mt-1 text-caption font-medium text-neutral-600">Projects</p>
        </div>

        {/* DigiTP Created (2) -> Lands on Activity > Live Deliveries */}
        <div
          onClick={() => navigate(`${ROUTES.activity}?tab=live`)}
          className="cursor-pointer rounded-2xl border border-[#d6e5f8] bg-[#eef5fd] p-3.5 shadow-xs transition-transform active:scale-95"
        >
          <span className="text-2xl font-bold tracking-tight text-[#134280]">
            {String(digitpCount).padStart(2, '0')}
          </span>
          <p className="mt-1 text-caption font-medium text-neutral-600">DigiTP Created</p>
        </div>

        {/* In Transit Vehicle (1) -> Lands directly on Live Vehicle Tracking */}
        <div
          onClick={() => {
            const activeId = data.activeDeliveries[0]?.id || 'del-004';
            navigate(ROUTES.liveVehicleTracking(activeId));
          }}
          className="cursor-pointer rounded-2xl border border-[#ebd9fb] bg-[#f7f0fd] p-3.5 shadow-xs transition-transform active:scale-95"
        >
          <span className="text-2xl font-bold tracking-tight text-[#7e22ce]">
            {String(inTransitCount).padStart(2, '0')}
          </span>
          <p className="mt-1 text-[11px] font-medium leading-tight text-neutral-600">In Transit Vehicle</p>
        </div>
      </div>

      {/* ---------------- 2. Quick Services (Swapped Order) ---------------- */}
      <div>
        <h2 className="mb-2.5 text-caption font-bold tracking-wider text-neutral-500 uppercase">
          Quick Services
        </h2>

        <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs">
          <div className="grid grid-cols-4 gap-2 text-center">
            {/* 1. Receive Material (Swapped to Pos 1) */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.receive)}
              className="flex flex-col items-center gap-2 group"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-[#eef4fe] text-[#1241a6] transition-transform group-hover:scale-105 group-active:scale-95">
                <QrCode size={20} />
              </span>
              <span className="text-[11px] font-medium leading-tight text-neutral-700">
                Receive<br />Material
              </span>
            </button>

            {/* 2. Track Vehicle */}
            <button
              type="button"
              onClick={() => {
                const activeId = data.activeDeliveries[0]?.id || 'del-004';
                navigate(ROUTES.liveVehicleTracking(activeId));
              }}
              className="flex flex-col items-center gap-2 group"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-[#eef4fe] text-[#1241a6] transition-transform group-hover:scale-105 group-active:scale-95">
                <Truck size={20} />
              </span>
              <span className="text-[11px] font-medium leading-tight text-neutral-700">
                Track<br />Vehicle
              </span>
            </button>

            {/* 3. Find Mineral Places */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.stockPoints)}
              className="flex flex-col items-center gap-2 group"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-[#eef4fe] text-[#1241a6] transition-transform group-hover:scale-105 group-active:scale-95">
                <Search size={20} />
              </span>
              <span className="text-[11px] font-medium leading-tight text-neutral-700">
                Find Mineral<br />Places
              </span>
            </button>

            {/* 4. Register Project (Swapped to Pos 4) */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.consumerProjectRegistration)}
              className="flex flex-col items-center gap-2 group"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-[#eef4fe] text-[#1241a6] transition-transform group-hover:scale-105 group-active:scale-95">
                <FolderPlus size={20} />
              </span>
              <span className="text-[11px] font-medium leading-tight text-neutral-700">
                Register<br />Project
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
            onClick={() => navigate(`${ROUTES.activity}?tab=live`)}
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
    </div>
  );
}
