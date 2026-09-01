import { useParams } from 'react-router-dom';
import { formatQuantity, statusPresentation, usesOrganizationContext } from '@/rules';
import {
  DetailList,
  ErrorState,
  LoadingState,
  SectionHeader,
  StatusBadge,
  Surface,
} from '@/design-system';
import { Screen } from '@/navigation';
import {
  enquiryRepository,
  mineralRepository,
  packageRepository,
  projectRepository,
  stockPointRepository,
  useAsync,
} from '@/data';
import { useCopy } from '@/content';

/**
 * ENQUIRY DETAILS.
 *
 * Shows the current status and nothing more about lifecycle. There is
 * deliberately NO progress tracker or stage timeline here: the real status
 * vocabulary and the enquiry-to-order transition are not yet confirmed
 * (open questions #2 and #3), and inventing a plausible-looking pipeline would
 * be exactly the fabricated workflow the product context warns against.
 *
 * Project and Package rows are present for Organizations and absent for Normal
 * Consumers — driven by capability, not by a hand-written condition.
 */
export function EnquiryDetailsScreen() {
  const { enquiryId } = useParams<{ enquiryId: string }>();
  const t = useCopy();

  const query = useAsync(async () => {
    if (!enquiryId) throw new Error('An enquiry is required');

    const enquiry = await enquiryRepository.getById(enquiryId);
    if (!enquiry) throw new Error('Enquiry not found');

    const [minerals, stockPoint, project, activePackage] = await Promise.all([
      mineralRepository.listAll(),
      stockPointRepository.getById(enquiry.stockPointId),
      enquiry.projectId ? projectRepository.getById(enquiry.projectId) : Promise.resolve(null),
      enquiry.packageId ? packageRepository.getById(enquiry.packageId) : Promise.resolve(null),
    ]);

    return { enquiry, minerals, stockPoint, project, activePackage };
  }, [enquiryId]);

  const enquiry = query.data?.enquiry;
  const showScope = enquiry ? usesOrganizationContext(enquiry.raisedByUserType) : false;

  return (
    <Screen
      title={t.enquiry.title}
      {...(enquiry ? { subtitle: enquiry.enquiryNumber } : {})}
      onBack
    >
      {query.loading && <LoadingState variant="list" rows={4} />}
      {query.error && <ErrorState onRetry={query.reload} />}

      {query.data && enquiry && (
        <div className="pb-8">
          <Surface className="border-b border-line px-4 py-4">
            <StatusBadge {...statusPresentation.enquiry(enquiry.status)} />
            <p className="mt-3 text-display text-ink tabular">
              {formatQuantity(enquiry.requiredQuantity)}
            </p>
            <p className="mt-1 text-body text-ink-secondary">
              {query.data.minerals.find((mineral) => mineral.id === enquiry.mineralId)?.name}
            </p>
          </Surface>

          <SectionHeader title={t.enquiry.requirement} />
          <Surface className="border-y border-line">
            <DetailList
              items={[
                { label: t.enquiry.enquiryNumber, value: enquiry.enquiryNumber, numeric: true },
                ...(enquiry.contactName ? [{ label: 'Contact name', value: enquiry.contactName }] : []),
                ...(enquiry.contactMobileNumber
                  ? [{ label: 'Contact mobile', value: enquiry.contactMobileNumber }]
                  : []),
                {
                  label: t.fields.stockPoint,
                  value: query.data.stockPoint?.name ?? '—',
                },
                /* Organization context — absent entirely for consumers. */
                ...(showScope && query.data.project
                  ? [{ label: t.context.project, value: query.data.project.name }]
                  : []),
                ...(showScope && query.data.activePackage
                  ? [{ label: t.context.package, value: query.data.activePackage.name }]
                  : []),
                ...(enquiry.requiredByDate
                  ? [{ label: t.enquiry.requiredBy, value: formatDate(enquiry.requiredByDate) }]
                  : []),
                { label: t.enquiry.raisedOn, value: formatDate(enquiry.createdAt) },
                { label: t.enquiry.lastUpdated, value: formatDate(enquiry.updatedAt) },
              ]}
            />
          </Surface>

          {enquiry.remarks && (
            <>
              <SectionHeader title={t.enquiry.remarks} />
              <Surface className="border-y border-line px-4 py-3">
                <p className="text-body text-ink-secondary">{enquiry.remarks}</p>
              </Surface>
            </>
          )}
        </div>
      )}
    </Screen>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
