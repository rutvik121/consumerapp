import { useNavigate } from 'react-router-dom';
import { PackageCheck, Truck } from 'lucide-react';
import { formatQuantity, usesOrganizationContext } from '@/rules';
import {
  EmptyState,
  ErrorState,
  ListGroup,
  ListRow,
  LoadingState,
  SectionHeader,
} from '@/design-system';
import { ROUTES, Screen } from '@/navigation';
import { deliveryRepository, mineralRepository, useAsync } from '@/data';
import { useCurrentUser, useOperatingContext } from '@/state';
import { useCopy } from '@/content';

/**
 * WHICH VEHICLE IS IN FRONT OF YOU?
 *
 * Receiving begins with a physical fact — a truck at a gate — so the entry
 * point is the list of vehicles that have actually arrived, not a search or a
 * blank scanner. The user picks the one they can see, and verification starts
 * from there.
 *
 * Only ARRIVED vehicles appear. A load still in transit cannot be received,
 * and offering it would invite someone to receive a vehicle that is not there.
 */
export function ReceiveScreen() {
  const user = useCurrentUser();
  const context = useOperatingContext();
  const navigate = useNavigate();
  const t = useCopy();

  const query = useAsync(async () => {
    if (!user) throw new Error('A session is required');

    const deliveries = usesOrganizationContext(user.userType)
      ? await deliveryRepository.list({
          ...(context?.organizationId ? { organizationId: context.organizationId } : {}),
          awaitingReceiptOnly: true,
        })
      : (await deliveryRepository.listForUser(user.id)).filter(
          (delivery) => delivery.status === 'ARRIVED_AT_DESTINATION',
        );

    const minerals = await mineralRepository.listAll();
    return { deliveries, minerals };
  }, [user?.id, context?.organizationId]);

  const minerals = query.data?.minerals ?? [];

  return (
    <Screen title={t.receiving.title} onBack>
      {query.loading && <LoadingState variant="list" rows={3} />}
      {query.error && <ErrorState onRetry={query.reload} />}

      {query.data && query.data.deliveries.length === 0 && (
        <EmptyState
          icon={<PackageCheck size={22} />}
          title={t.receiving.noArrivals}
          description={t.receiving.noArrivalsBody}
        />
      )}

      {query.data && query.data.deliveries.length > 0 && (
        <>
          <SectionHeader
            title={t.receiving.pickTitle}
            description={t.receiving.pickBody}
          />
          <ListGroup className="border-y border-line">
            {query.data.deliveries.map((delivery) => {
              const mineral = minerals.find(
                (candidate) => candidate.id === delivery.permit.mineralId,
              );

              return (
                <ListRow
                  key={delivery.id}
                  leading={<Truck size={17} />}
                  leadingTone="warning"
                  title={delivery.vehicle.registrationNumber}
                  subtitle={`${mineral?.name} · ${formatQuantity(delivery.dispatchedQuantity)}`}
                  detail={delivery.destination.label}
                  onClick={() => navigate(ROUTES.receiveDelivery(delivery.id))}
                />
              );
            })}
          </ListGroup>
        </>
      )}
    </Screen>
  );
}
