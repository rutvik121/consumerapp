import { useNavigate } from 'react-router-dom';
import { Package as PackageIcon } from 'lucide-react';
import type { ID, Order } from '@/domain';
import { formatQuantity, statusPresentation, usesOrganizationContext } from '@/rules';
import {
  Button,
  EmptyState,
  ErrorState,
  ListGroup,
  ListRow,
  LoadingState,
  StatusBadge,
} from '@/design-system';
import { ROUTES, Screen } from '@/navigation';
import { mineralRepository, orderRepository, stockPointRepository, useAsync } from '@/data';
import { useCurrentUser, useOperatingContext } from '@/state';
import { useCopy } from '@/content';

/**
 * ORDER LIST — shared by both roles.
 *
 * An Organization sees everything under its organization; a Normal Consumer
 * sees only what they placed. Same screen, different scope.
 *
 * Both statuses are shown because they answer different questions: dispatch is
 * what the SOURCE has done, receiving is what has happened at the DESTINATION.
 * Collapsing them into one "order status" would hide the gap between the two,
 * which is exactly the gap this ecosystem exists to close.
 */
export function OrdersScreen() {
  const user = useCurrentUser();
  const context = useOperatingContext();
  const navigate = useNavigate();
  const t = useCopy();

  const query = useAsync(async () => {
    if (!user) throw new Error('A session is required');

    const scope = usesOrganizationContext(user.userType)
      ? { ...(context?.organizationId ? { organizationId: context.organizationId } : {}) }
      : { placedByUserId: user.id };

    const [orders, minerals, stockPoints] = await Promise.all([
      orderRepository.list(scope),
      mineralRepository.listAll(),
      stockPointRepository.search(),
    ]);

    return { orders, minerals, stockPoints };
  }, [user?.id, context?.organizationId]);

  const mineralName = (id: ID) =>
    query.data?.minerals.find((mineral) => mineral.id === id)?.name ?? 'Mineral';
  const stockPointName = (id: ID) =>
    query.data?.stockPoints.find((result) => result.stockPoint.id === id)?.stockPoint.name ?? '—';

  return (
    <Screen title={t.orders.title}>
      {query.loading && <LoadingState variant="list" rows={4} />}
      {query.error && <ErrorState onRetry={query.reload} />}

      {query.data && query.data.orders.length === 0 && (
        <EmptyState
          icon={<PackageIcon size={22} />}
          title={t.orders.noOrders}
          description={t.orders.noOrdersBody}
          action={
            <Button onClick={() => navigate(ROUTES.stockPoints)}>
              {t.enquiry.findStockPoint}
            </Button>
          }
        />
      )}

      {query.data && query.data.orders.length > 0 && (
        <ListGroup className="border-b border-line">
          {query.data.orders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              mineralName={mineralName(order.mineralId)}
              stockPointName={stockPointName(order.stockPointId)}
              onOpen={() => navigate(ROUTES.orderDetails(order.id))}
            />
          ))}
        </ListGroup>
      )}
    </Screen>
  );
}

function OrderRow({
  order,
  mineralName,
  stockPointName,
  onOpen,
}: {
  order: Order;
  mineralName: string;
  stockPointName: string;
  onOpen: () => void;
}) {
  const receiving = statusPresentation.receiving(order.receivingStatus);
  const dispatch = statusPresentation.dispatch(order.dispatchStatus);

  return (
    <ListRow
      leading={<PackageIcon size={17} />}
      leadingTone={order.receivingStatus === 'RECEIVED_WITH_DISCREPANCY' ? 'danger' : 'primary'}
      title={`${mineralName} · ${formatQuantity(order.orderedQuantity)}`}
      subtitle={stockPointName}
      detail={order.orderNumber}
      meta={
        <>
          <StatusBadge label={receiving.label} tone={receiving.tone} size="sm" />
          <span className="text-caption text-ink-muted">{dispatch.label}</span>
        </>
      }
      onClick={onOpen}
    />
  );
}
