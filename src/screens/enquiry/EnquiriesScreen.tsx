import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import type { Enquiry, ID } from '@/domain';
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
import { enquiryRepository, mineralRepository, stockPointRepository, useAsync } from '@/data';
import { useCurrentUser, useOperatingContext } from '@/state';
import { useCopy } from '@/content';

/**
 * ENQUIRY LIST — shared by both roles.
 *
 * Scope is the only difference: an Organization sees everything raised under
 * its organization; a Normal Consumer sees only what they raised themselves.
 * The screen itself is identical, which is what "one application" means in
 * practice.
 */
export function EnquiriesScreen() {
  const user = useCurrentUser();
  const context = useOperatingContext();
  const navigate = useNavigate();
  const t = useCopy();

  const query = useAsync(async () => {
    if (!user) throw new Error('A session is required');

    const scope = usesOrganizationContext(user.userType)
      ? { ...(context?.organizationId ? { organizationId: context.organizationId } : {}) }
      : { raisedByUserId: user.id };

    const [enquiries, minerals, stockPoints] = await Promise.all([
      enquiryRepository.list(scope),
      mineralRepository.listAll(),
      stockPointRepository.search(),
    ]);

    return { enquiries, minerals, stockPoints };
  }, [user?.id, context?.organizationId]);

  const mineralName = (id: ID) =>
    query.data?.minerals.find((mineral) => mineral.id === id)?.name ?? 'Mineral';
  const stockPointName = (id: ID) =>
    query.data?.stockPoints.find((result) => result.stockPoint.id === id)?.stockPoint.name ??
    'Stock point';

  return (
    <Screen title={t.enquiry.listTitle} onBack>
      {query.loading && <LoadingState variant="list" rows={4} />}
      {query.error && <ErrorState onRetry={query.reload} />}

      {query.data && query.data.enquiries.length === 0 && (
        <EmptyState
          icon={<FileText size={22} />}
          title={t.enquiry.noEnquiries}
          description={t.enquiry.noEnquiriesBody}
          action={
            <Button onClick={() => navigate(ROUTES.stockPoints)}>
              {t.enquiry.findStockPoint}
            </Button>
          }
        />
      )}

      {query.data && query.data.enquiries.length > 0 && (
        <ListGroup className="border-b border-line">
          {query.data.enquiries.map((enquiry) => (
            <EnquiryRow
              key={enquiry.id}
              enquiry={enquiry}
              mineralName={mineralName(enquiry.mineralId)}
              stockPointName={stockPointName(enquiry.stockPointId)}
              onOpen={() => navigate(ROUTES.enquiryDetails(enquiry.id))}
            />
          ))}
        </ListGroup>
      )}
    </Screen>
  );
}

function EnquiryRow({
  enquiry,
  mineralName,
  stockPointName,
  onOpen,
}: {
  enquiry: Enquiry;
  mineralName: string;
  stockPointName: string;
  onOpen: () => void;
}) {
  const status = statusPresentation.enquiry(enquiry.status);

  return (
    <ListRow
      leading={<FileText size={17} />}
      title={`${mineralName} · ${formatQuantity(enquiry.requiredQuantity)}`}
      subtitle={stockPointName}
      detail={enquiry.enquiryNumber}
      meta={<StatusBadge label={status.label} tone={status.tone} size="sm" />}
      onClick={onOpen}
    />
  );
}
