import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Info } from 'lucide-react';
import type { ID } from '@/domain';
import { enquiryScopeFor, formatQuantity, validateEnquiry } from '@/rules';
import {
  Button,
  ErrorState,
  Input,
  LoadingState,
  QuantityInput,
  SectionHeader,
  Select,
  Surface,
  Textarea,
} from '@/design-system';
import { OrganizationContextBar, ROUTES, Screen } from '@/navigation';
import {
  enquiryRepository,
  mineralRepository,
  packageRepository,
  projectRepository,
  stockPointRepository,
  useAsync,
} from '@/data';
import { useOperatingContext } from '@/state';
import { useCopy } from '@/content';

/**
 * MINERAL ENQUIRY — the requirement, stated to a chosen source.
 *
 * WHAT THIS SCREEN DOES NOT ASK FOR:
 *   · the stock point — the user arrived from it
 *   · the project — already known
 *   · the package — already known
 *   · a price, a quantity of "items", a delivery slot
 *
 * That list is the point. An Organization user who drilled
 * Projects → Project → Package → Find Stock Point → here has already answered
 * four questions; asking any of them again would be the exact repetition the
 * product context rules out. Context is SHOWN so it can be trusted, and
 * attached to the record via `enquiryScopeFor()` — the one place scope becomes
 * data, and the reason a Normal Consumer cannot acquire these fields at all.
 */
export function CreateEnquiryScreen() {
  const { stockPointId } = useParams<{ stockPointId: string }>();
  const context = useOperatingContext();
  const navigate = useNavigate();
  const t = useCopy();

  const [mineralId, setMineralId] = useState<ID | ''>('');
  const [selectedProjectId, setSelectedProjectId] = useState<ID | ''>(context?.projectId ?? '');
  const [selectedMaterialId, setSelectedMaterialId] = useState<ID | ''>('');
  const [selectedPackageId, setSelectedPackageId] = useState<ID | ''>(context?.packageId ?? '');
  const [quantity, setQuantity] = useState<number | null>(null);
  const [requiredByDate, setRequiredByDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState<{ mineralId?: string; requiredQuantity?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [sentEnquiryId, setSentEnquiryId] = useState<ID | null>(null);

  const query = useAsync(async () => {
    if (!stockPointId) throw new Error('A stock point is required');

    const [stockPoint, minerals] = await Promise.all([
      stockPointRepository.getById(stockPointId),
      mineralRepository.listAll(),
    ]);
    if (!stockPoint) throw new Error('Stock point not found');

    let projects: { id: ID; name: string; materialIds?: ID[] }[] = [];
    let packages: { id: ID; name: string; projectId: ID }[] = [];

    if (context?.userType === 'ORGANIZATION' && context.organizationId) {
      const [orgProjects, orgPackages] = await Promise.all([
        projectRepository.listByOrganization(context.organizationId),
        packageRepository.listByOrganization(context.organizationId),
      ]);
      projects = orgProjects.map((project) => ({
        id: project.id,
        name: project.name,
        materialIds: project.materialIds,
      }));
      packages = orgPackages.map((pkg) => ({ id: pkg.id, name: pkg.name, projectId: pkg.projectId }));
    }

    if (context?.userType === 'NORMAL_CONSUMER') {
      const consumerProjects = await projectRepository.listForConsumer(context.userId);
      projects = consumerProjects.map((project) => ({
        id: project.id,
        name: project.name,
        materialIds: project.materialIds,
      }));
    }

    return { stockPoint, minerals, projects, packages };
  }, [stockPointId, context?.organizationId, context?.projectId, context?.packageId, context?.userId, context?.userType]);

  const stockPoint = query.data?.stockPoint;
  const minerals = query.data?.minerals ?? [];
  const projects = query.data?.projects ?? [];
  const packages = query.data?.packages ?? [];

  useEffect(() => {
    if (context?.projectId && !selectedProjectId) setSelectedProjectId(context.projectId);
    if (context?.packageId && !selectedPackageId) setSelectedPackageId(context.packageId);
  }, [context?.projectId, context?.packageId, selectedProjectId, selectedPackageId]);

  useEffect(() => {
    if (selectedProjectId && selectedPackageId) {
      const packageIsValid = packages.some(
        (pkg) => pkg.id === selectedPackageId && pkg.projectId === selectedProjectId,
      );
      if (!packageIsValid) setSelectedPackageId('');
    }
  }, [packages, selectedPackageId, selectedProjectId]);

  useEffect(() => {
    const project = projects.find((item) => item.id === selectedProjectId);
    if (!project?.materialIds || project.materialIds.length === 0) {
      setSelectedMaterialId('');
      return;
    }

    if (!selectedMaterialId && project.materialIds[0]) {
      setSelectedMaterialId(project.materialIds[0]);
      setMineralId(project.materialIds[0]);
    }

    if (selectedMaterialId && !project.materialIds.includes(selectedMaterialId)) {
      const fallback = project.materialIds[0] ?? '';
      setSelectedMaterialId(fallback);
      if (fallback) setMineralId(fallback);
    }
  }, [projects, selectedMaterialId, selectedProjectId]);

  const projectOptions = projects.map((project) => ({ value: project.id, label: project.name }));
  const packageOptions = (selectedProjectId
    ? packages.filter((pkg) => pkg.projectId === selectedProjectId)
    : packages
  ).map((pkg) => ({ value: pkg.id, label: pkg.name }));
  const materialOptions = (selectedProjectId
    ? projects.find((project) => project.id === selectedProjectId)?.materialIds ?? []
    : []
  )
    .map((materialId) => ({
      value: materialId,
      label: minerals.find((mineral) => mineral.id === materialId)?.name ?? 'Mineral',
    }))
    .filter((option) => option.label !== 'Mineral');

  /* Only minerals this stock point actually holds can be enquired for. */
  const options = (stockPoint?.minerals ?? []).map((holding) => ({
    value: holding.mineralId,
    label: minerals.find((mineral) => mineral.id === holding.mineralId)?.name ?? 'Mineral',
  }));

  const selectedHolding = stockPoint?.minerals.find(
    (holding) => holding.mineralId === mineralId,
  );
  const available = selectedHolding?.availableQuantity ?? null;
  const unit = available?.unit ?? 'MT';

  const validation = validateEnquiry(
    { mineralId: mineralId || null, requiredQuantity: quantity, requiredByDate, remarks },
    available,
  );

  async function handleSubmit() {
    if (!validation.valid || !context || !stockPoint || !mineralId || quantity === null) {
      setErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    try {
      const scope = enquiryScopeFor({
        userType: context.userType,
        organizationId: context.organizationId,
        projectId: selectedProjectId || context.projectId,
        packageId: selectedPackageId || context.packageId,
      });

      const enquiry = await enquiryRepository.create({
        raisedByUserId: context.userId,
        raisedByUserType: context.userType,
        // The single point where operating context becomes enquiry data.
        ...scope,
        stockPointId: stockPoint.id,
        mineralId,
        requiredQuantity: { value: quantity, unit },
        ...(requiredByDate ? { requiredByDate } : {}),
        ...(remarks.trim() ? { remarks: remarks.trim() } : {}),
      });

      setSentEnquiryId(enquiry.id);
    } finally {
      setSubmitting(false);
    }
  }

  if (sentEnquiryId) {
    return (
      <Screen title={t.enquiry.sentTitle}>
        <div className="flex flex-col items-center px-8 py-16 text-center">
          <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-success-50 text-success-600">
            <CheckCircle2 size={28} aria-hidden />
          </span>
          <h2 className="text-title-lg text-ink">{t.enquiry.sentTitle}</h2>
          <p className="mt-2 max-w-[34ch] text-body text-ink-secondary">{t.enquiry.sentBody}</p>

          <div className="mt-8 w-full space-y-3">
            <Button
              size="lg"
              fullWidth
              onClick={() => navigate(ROUTES.enquiryDetails(sentEnquiryId), { replace: true })}
            >
              {t.enquiry.viewEnquiry}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              fullWidth
              onClick={() => navigate(ROUTES.home, { replace: true })}
            >
              {t.nav.home}
            </Button>
          </div>
        </div>
      </Screen>
    );
  }

  return (
    <Screen
      title={t.enquiry.title}
      {...(stockPoint ? { subtitle: stockPoint.name } : {})}
      onBack
      context={<OrganizationContextBar showChange={false} />}
      footer={
        <Button size="lg" fullWidth loading={submitting} onClick={handleSubmit}>
          {submitting ? t.enquiry.submitting : t.enquiry.submit}
        </Button>
      }
    >
      {query.loading && <LoadingState variant="list" rows={3} />}
      {query.error && <ErrorState onRetry={query.reload} />}

      {query.data && stockPoint && (
        <div className="pb-6">
          <SectionHeader title={t.enquiry.requirement} />

          <Surface className="border-y border-line px-4 py-4">
            <div className="space-y-4">
              {projectOptions.length > 0 && (
                <Select
                  label={context?.userType === 'ORGANIZATION' ? 'Project' : 'Project for this enquiry'}
                  placeholder="Select a project"
                  value={selectedProjectId}
                  options={projectOptions}
                  onChange={(event) => {
                    const nextProjectId = event.target.value;
                    setSelectedProjectId(nextProjectId);
                    setSelectedPackageId('');
                  }}
                />
              )}

              {context?.userType === 'ORGANIZATION' && packageOptions.length > 0 && (
                <Select
                  label="Package"
                  placeholder="Select a package"
                  value={selectedPackageId}
                  options={packageOptions}
                  onChange={(event) => setSelectedPackageId(event.target.value)}
                />
              )}

              {context?.userType === 'NORMAL_CONSUMER' && projectOptions.length === 0 && (
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => navigate(ROUTES.consumerProjectRegistration)}
                >
                  Register a project first
                </Button>
              )}

              {materialOptions.length > 0 && (
                <Select
                  label="Project material"
                  placeholder="Select the project material"
                  value={selectedMaterialId}
                  options={materialOptions}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setSelectedMaterialId(nextValue);
                    if (nextValue) setMineralId(nextValue);
                  }}
                />
              )}

              <Select
                label={t.enquiry.selectMineral}
                required
                placeholder="Select a mineral"
                value={mineralId}
                options={options}
                {...(errors.mineralId ? { error: errors.mineralId } : {})}
                onChange={(event) => {
                  setMineralId(event.target.value);
                  setSelectedMaterialId(event.target.value);
                  setErrors((prev) => ({ ...prev, mineralId: undefined }));
                }}
              />

              <QuantityInput
                label={t.enquiry.quantityLabel}
                required
                value={quantity}
                unit={unit}
                onChange={(value) => {
                  setQuantity(value);
                  setErrors((prev) => ({ ...prev, requiredQuantity: undefined }));
                }}
                {...(errors.requiredQuantity ? { error: errors.requiredQuantity } : {})}
                {...(available && !errors.requiredQuantity
                  ? { hint: t.enquiry.availableHint(formatQuantity(available)) }
                  : {})}
              />

              {/* Non-blocking: a stock point restocks, and an enquiry is a
                  question rather than a commitment. */}
              {validation.warning && (
                <p className="flex items-start gap-2 rounded-md bg-warning-50 px-3 py-2 text-body-sm text-warning-700">
                  <Info size={15} className="mt-0.5 shrink-0" aria-hidden />
                  {validation.warning}
                </p>
              )}

              <Input
                label={t.enquiry.requiredBy}
                type="date"
                hint={t.enquiry.requiredByHint}
                value={requiredByDate}
                onChange={(event) => setRequiredByDate(event.target.value)}
              />

              <Textarea
                label={t.enquiry.remarks}
                placeholder={t.enquiry.remarksPlaceholder}
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
              />
            </div>
          </Surface>
        </div>
      )}
    </Screen>
  );
}
