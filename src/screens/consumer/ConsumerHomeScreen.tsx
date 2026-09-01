import { useNavigate } from 'react-router-dom';
import { FileText, Package as PackageIcon, Search, Truck, Warehouse } from 'lucide-react';
import type { Delivery, Enquiry, Mineral, Order, Project, Quantity } from '@/domain';
import {
  canReceiveDelivery,
  formatQuantity,
  formatQuantityValue,
  isDeliveryActive,
  primaryAvailable,
  statusPresentation,
} from '@/rules';
import {
  Button,
  EmptyState,
  ErrorState,
  ListGroup,
  ListRow,
  LoadingState,
  MetricTile,
  SectionHeader,
  StatusBadge,
  Surface,
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
import { useCopy } from '@/content';

interface ConsumerHomeData {
  activeDeliveries: Delivery[];
  enquiries: Enquiry[];
  orders: Order[];
  available: Quantity | null;
  minerals: Mineral[];
  projects: Project[];
}

/**
 * NORMAL CONSUMER HOME.
 *
 * The same mineral lifecycle as an Organization, without the hierarchy. No
 * projects, no packages, no Temporary Excavation — and not as hidden sections,
 * but as concepts that do not exist for this user at all.
 *
 * Ordered by what an individual actually needs:
 *   1. an arriving vehicle, when there is one — it is time-critical
 *   2. finding a source — the reason they opened the app
 *   3. what they have already asked for
 *   4. what they are holding
 *
 * Built from the same components and repositories as the Organization Home.
 * What differs is what is shown, never how it is built.
 */
export function ConsumerHomeScreen() {
  const user = useCurrentUser();
  const t = useCopy();

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
    <Screen title={t.app.name} {...(user ? { subtitle: user.fullName } : {})}>
      {query.loading && <LoadingState variant="list" rows={4} />}
      {query.error && <ErrorState onRetry={query.reload} />}
      {query.data && <ConsumerHomeContent data={query.data} />}
    </Screen>
  );
}

/** Split out so the loaded data narrows once instead of at every usage. */
function ConsumerHomeContent({ data }: { data: ConsumerHomeData }) {
  const navigate = useNavigate();
  const t = useCopy();

  const mineralName = (mineralId: string) =>
    data.minerals.find((mineral) => mineral.id === mineralId)?.name ?? 'Mineral';

  const hasActivity = data.enquiries.length > 0 || data.orders.length > 0;

  return (
    <div className="pb-8">
      {/* ---------- 1. An arriving vehicle outranks everything ---------- */}
      {data.activeDeliveries.length > 0 && (
        <>
          <SectionHeader title={t.consumerHome.onTheWay} />
          <Surface className="border-y border-line">
            {data.activeDeliveries.map((delivery) => (
              <div key={delivery.id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-600">
                    <Truck size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="tabular truncate text-title text-ink">
                      {delivery.vehicle.registrationNumber}
                    </p>
                    <p className="mt-0.5 truncate text-body-sm text-ink-secondary">
                      {mineralName(delivery.permit.mineralId)} ·{' '}
                      <span className="tabular">
                        {formatQuantity(delivery.dispatchedQuantity)}
                      </span>
                    </p>
                  </div>
                  <StatusBadge {...statusPresentation.delivery(delivery.status)} size="sm" />
                </div>

                <div className="mt-3 flex gap-2 pl-12">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(ROUTES.deliveryTracking(delivery.id))}
                  >
                    {t.organizationHome.trackLive}
                  </Button>
                  {canReceiveDelivery(delivery) && (
                    <Button size="sm" onClick={() => navigate(ROUTES.receive)}>
                      {t.organizationHome.receive}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </Surface>
        </>
      )}

      {/* ---------- 2. A project gives the home page a real operational context ---------- */}
      <SectionHeader title="Your project" />
      {data.projects.length === 0 ? (
        <Surface className="border-y border-line px-4 py-5">
          <p className="text-body text-ink-secondary">
            Register a project to personalize your sourcing and keep the home screen grounded in a real site.
          </p>
          <Button
            size="lg"
            fullWidth
            className="mt-4"
            onClick={() => navigate(ROUTES.consumerProjectRegistration)}
          >
            Register project
          </Button>
        </Surface>
      ) : (
        <Surface className="border-y border-line px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-overline uppercase text-ink-muted">Active project</p>
              <h3 className="mt-1 text-title text-ink">{data.projects[0].name}</h3>
            </div>
            <span className="rounded-full bg-success-50 px-2 py-1 text-caption font-medium text-success-700">
              {data.projects[0].status}
            </span>
          </div>
          <p className="mt-2 text-body-sm text-ink-secondary">
            {data.projects[0].location.line1}, {data.projects[0].location.taluka}, {data.projects[0].location.district}
          </p>
          <Button
            variant="secondary"
            fullWidth
            className="mt-3"
            onClick={() => navigate(ROUTES.consumerProjectRegistration)}
          >
            Update project
          </Button>
        </Surface>
      )}

      {/* ---------- 3. Inventory is the most important operational summary ---------- */}
      <SectionHeader title={t.consumerHome.yourInventory} />
      <Surface className="border-y border-line px-4 py-4">
        <MetricTile
          size="lg"
          label={t.consumerHome.available}
          value={data.available ? formatQuantityValue(data.available) : '0'}
          unit={data.available?.unit ?? 'MT'}
          onClick={() => navigate(ROUTES.inventory)}
        />
        {!data.available && (
          <p className="mt-2 flex items-center gap-2 text-caption text-ink-muted">
            <Warehouse size={13} aria-hidden />
            Mineral you receive will appear here.
          </p>
        )}
      </Surface>

      {/* ---------- 4. The reason they opened the app ---------- */}
      <Surface className="mt-5 border-y border-line px-4 py-5">
        <h2 className="text-title-lg text-ink">{t.consumerHome.needMineral}</h2>
        <p className="mt-1.5 text-body text-ink-secondary">{t.consumerHome.needMineralBody}</p>
        <Button
          size="lg"
          fullWidth
          className="mt-4"
          leftIcon={<Search size={16} />}
          onClick={() => navigate(ROUTES.stockPoints)}
        >
          {t.discovery.title}
        </Button>
      </Surface>

      {/* ---------- 4. What they have already asked for ---------- */}
      <SectionHeader
        title={t.consumerHome.recentActivity}
        {...(hasActivity
          ? {
              action: (
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.enquiries)}
                  className="text-label font-medium text-primary-700"
                >
                  {t.actions.viewAll}
                </button>
              ),
            }
          : {})}
      />

      {!hasActivity ? (
        <Surface className="border-y border-line">
          <EmptyState
            className="py-8"
            icon={<FileText size={22} />}
            title={t.consumerHome.noActivity}
            description={t.consumerHome.noActivityBody}
          />
        </Surface>
      ) : (
        <ListGroup className="border-y border-line">
          {data.enquiries.slice(0, 3).map((enquiry) => (
            <ListRow
              key={enquiry.id}
              leading={<FileText size={17} />}
              title={`${mineralName(enquiry.mineralId)} · ${formatQuantity(enquiry.requiredQuantity)}`}
              subtitle={enquiry.enquiryNumber}
              meta={<StatusBadge {...statusPresentation.enquiry(enquiry.status)} size="sm" />}
              onClick={() => navigate(ROUTES.enquiryDetails(enquiry.id))}
            />
          ))}
          {data.orders.slice(0, 2).map((order) => (
            <ListRow
              key={order.id}
              leading={<PackageIcon size={17} />}
              title={`${mineralName(order.mineralId)} · ${formatQuantity(order.orderedQuantity)}`}
              subtitle={order.orderNumber}
              meta={<StatusBadge {...statusPresentation.receiving(order.receivingStatus)} size="sm" />}
              onClick={() => navigate(ROUTES.orderDetails(order.id))}
            />
          ))}
        </ListGroup>
      )}
    </div>
  );
}
