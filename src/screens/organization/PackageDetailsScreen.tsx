import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileText,
  HardHat,
  PackageCheck,
  Search,
  Truck,
  Warehouse,
} from 'lucide-react';
import { formatQuantityValue, primaryAvailable, statusPresentation } from '@/rules';
import {
  ErrorState,
  ListGroup,
  ListRow,
  LoadingState,
  MetricTile,
  SectionHeader,
  StatusBadge,
  Surface,
} from '@/design-system';
import { OrganizationContextBar, ROUTES, Screen } from '@/navigation';
import {
  deliveryRepository,
  inventoryRepository,
  orderRepository,
  packageRepository,
  projectRepository,
  useAsync,
} from '@/data';
import { useOrganizationContextStore } from '@/state';
import { useCopy } from '@/content';
import { LocationLine } from './ProjectsScreen';

/**
 * ORGANIZATION ONLY — level 3, and THE operational entry point.
 *
 * This screen is where the hierarchy stops being navigation and becomes
 * context. Opening a package sets it as the active scope, and from here every
 * mineral operation — discovery, enquiry, orders, receiving, inventory —
 * inherits Project + Package automatically. None of those screens will ask for
 * it again.
 *
 * The supervisor is shown as read-only information. Supervisors work in a
 * separate application; there is deliberately nothing to tap.
 */
export function PackageDetailsScreen() {
  const { projectId, packageId } = useParams<{ projectId: string; packageId: string }>();
  const navigate = useNavigate();
  const setProject = useOrganizationContextStore((state) => state.setProject);
  const setPackage = useOrganizationContextStore((state) => state.setPackage);
  const t = useCopy();

  const query = useAsync(async () => {
    if (!projectId || !packageId) throw new Error('A project and package are required');

    const [project, activePackage] = await Promise.all([
      projectRepository.getById(projectId),
      packageRepository.getById(packageId),
    ]);
    if (!project || !activePackage) throw new Error('Package not found');

    const [orders, deliveries, balances] = await Promise.all([
      orderRepository.list({ packageId }),
      deliveryRepository.list({ packageId, activeOnly: true }),
      inventoryRepository.list({ packageId }),
    ]);

    return { project, activePackage, orders, deliveries, balances };
  }, [projectId, packageId]);

  const project = query.data?.project;
  const activePackage = query.data?.activePackage;

  // Entering the package establishes the operating context for everything below.
  useEffect(() => {
    if (project) setProject(project);
    if (activePackage) setPackage(activePackage);
  }, [project, activePackage, setProject, setPackage]);

  const available = query.data ? primaryAvailable(query.data.balances) : null;

  return (
    <Screen
      title={activePackage?.name ?? t.projects.packageDetails}
      {...(activePackage ? { subtitle: activePackage.code } : {})}
      onBack
      context={<OrganizationContextBar showPackage={false} />}
    >
      {query.loading && <LoadingState variant="list" rows={4} />}
      {query.error && <ErrorState onRetry={query.reload} />}

      {query.data && activePackage && (
        <div className="pb-8">
          <Surface className="border-b border-line px-4 py-4">
            <div className="mb-3">
              <StatusBadge {...statusPresentation.package(activePackage.status)} />
            </div>
            <LocationLine
              text={`${activePackage.siteAddress.line1}, ${activePackage.siteAddress.taluka}, ${activePackage.siteAddress.district}`}
            />

            <div className="mt-5 grid grid-cols-3 gap-4">
              <MetricTile
                label={t.organizationHome.activeOrders}
                value={
                  query.data.orders.filter((order) => order.receivingStatus !== 'RECEIVED').length
                }
              />
              <MetricTile
                label="In transit"
                value={query.data.deliveries.length}
                tone={query.data.deliveries.length > 0 ? 'warning' : 'default'}
              />
              <MetricTile
                label={t.fields.available}
                value={available ? formatQuantityValue(available) : '—'}
                {...(available ? { unit: available.unit } : {})}
              />
            </div>
          </Surface>

          {/* ---------- Mineral operations, all scoped to this package ---------- */}
          <SectionHeader
            title={t.projects.mineralOperations}
            description={t.projects.operationsHint}
          />
          <ListGroup className="border-y border-line">
            <ListRow
              leading={<Search size={17} />}
              title={t.organizationHome.findStockPoint}
              subtitle="Discover a source near this site"
              onClick={() => navigate(ROUTES.stockPoints)}
            />
            <ListRow
              leading={<FileText size={17} />}
              title="Enquiries"
              subtitle="Mineral requirements for this package"
              onClick={() => navigate(ROUTES.enquiries)}
            />
            <ListRow
              leading={<Truck size={17} />}
              title={t.projects.viewOrders}
              subtitle="Orders and deliveries for this package"
              onClick={() => navigate(ROUTES.orders)}
            />
            <ListRow
              leading={<PackageCheck size={17} />}
              title={t.organizationHome.receiveMineral}
              subtitle="Verify and receive an arriving vehicle"
              onClick={() => navigate(ROUTES.receive)}
            />
            <ListRow
              leading={<Warehouse size={17} />}
              title={t.projects.viewInventory}
              subtitle="Received, consumed and available"
              onClick={() => navigate(ROUTES.inventory)}
            />
          </ListGroup>

          {/* ---------- Supervisor: read-only context, no actions ---------- */}
          {activePackage.supervisor && (
            <>
              <SectionHeader title={t.fields.supervisor} />
              <Surface className="border-y border-line">
                <ListRow
                  leading={<HardHat size={17} />}
                  leadingTone="neutral"
                  title={activePackage.supervisor.name}
                  subtitle={`${activePackage.supervisor.employeeCode} · ${activePackage.supervisor.mobileNumber}`}
                  trailing={null}
                />
              </Surface>
              <p className="px-4 pt-2 text-caption text-ink-muted">
                {t.projects.supervisorNote}
              </p>
            </>
          )}
        </div>
      )}
    </Screen>
  );
}
