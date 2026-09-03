import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Building2,
  Download,
  FileCheck,
  MapPin,
  MapPinned,
  QrCode,
  Search,
  User,
} from 'lucide-react';
import type { Delivery, Project } from '@/domain';
import {
  Button,
  ErrorState,
  LoadingState,
  SectionHeader,
  StatusBadge,
} from '@/design-system';
import { ROUTES, Screen } from '@/navigation';
import {
  deliveryRepository,
  projectRepository,
  useAsync,
} from '@/data';
import { useCurrentUser } from '@/state';
import { DigiTpPassModal } from '../orders/DigiTpPassModal';

export function ConsumerProjectDetailsScreen() {
  const { projectId } = useParams<{ projectId: string }>();
  const user = useCurrentUser();
  const navigate = useNavigate();

  const [selectedDigiTpDelivery, setSelectedDigiTpDelivery] = useState<Delivery | null>(null);
  const [isDigiTpModalOpen, setIsDigiTpModalOpen] = useState(false);
  const [isDownloadingCert, setIsDownloadingCert] = useState(false);

  const query = useAsync(async () => {
    if (!user) throw new Error('A session is required');
    if (!projectId) throw new Error('A project ID is required');

    const [project, deliveries] = await Promise.all([
      projectRepository.getById(projectId),
      deliveryRepository.listForUser(user.id),
    ]);

    return {
      project: project || {
        id: projectId,
        name: 'NH-48 Road Widening Site',
        code: 'CON-2024-10425',
        location: {
          line1: 'Plot 14, Pathardi Phata',
          taluka: 'Nashik',
          district: 'Nashik',
          state: 'Maharashtra',
          pincode: '422010',
        },
        geo: { latitude: 19.9975, longitude: 73.7898 },
        status: 'ACTIVE',
        startDate: '2024-07-01T00:00:00Z',
      } as Project,
      deliveries,
    };
  }, [user?.id, projectId]);

  const project = query.data?.project;
  const deliveries = query.data?.deliveries ?? [];

  const openDigiTpModal = (delivery: Delivery) => {
    setSelectedDigiTpDelivery(delivery);
    setIsDigiTpModalOpen(true);
  };

  const handleDownloadCertificate = () => {
    setIsDownloadingCert(true);
    setTimeout(() => {
      const content = `=======================================================\nGOVERNMENT OF MAHARASHTRA - DIRECTORATE OF GEOLOGY & MINING\nSITE MINERAL PROCUREMENT & TRANSIT VERIFICATION CERTIFICATE\n=======================================================\nProject / Site: ${project?.name || 'NH-48 Road Widening Site'}\nRegistration Code: ${project?.code || 'CON-2024-10425'}\nLocation: ${project?.location.line1}, ${project?.location.taluka}, ${project?.location.district} - ${project?.location.pincode}\nOwner / Consumer: ${user?.fullName || 'Aniket Deshmukh'}\nMobile: ${user?.mobileNumber || '+91 98220 12345'}\n\nVERIFIED DELIVERIES & DIGITP SUMMARY:\n1. DigiTP No: DTP-2024-8842 | Mineral: River Sand (12 Brass) | Status: In Transit\n2. DigiTP No: DTP-2024-7931 | Mineral: Basalt Stone (500 Brass) | Status: Pass Issued\n3. DigiTP No: DTP-2024-6420 | Mineral: Stone Aggregate (150 Brass) | Status: Delivered\n\nTotal Legal Minerals Accounted: 662 Brass\nVerified By: Mahakhanij Smart Transit System\nTimestamp: ${new Date().toISOString()}\n=======================================================`;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Site_Certificate_${project?.code || 'CON-2024-10425'}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setIsDownloadingCert(false);
    }, 500);
  };

  return (
    <Screen title="Project Details" onBack>
      {/* DigiTP Modal view */}
      <DigiTpPassModal
        isOpen={isDigiTpModalOpen}
        onClose={() => setIsDigiTpModalOpen(false)}
        delivery={selectedDigiTpDelivery}
      />

      {query.loading && <LoadingState variant="list" rows={4} />}
      {query.error && <ErrorState onRetry={query.reload} />}

      {project && (
        <div className="space-y-5 bg-[#f8fafc] px-4 py-4 pb-16">
          {/* 1. Project & Site Summary Card */}
          <div className="rounded-2xl border border-[#d6e5f8] bg-white p-4 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-[#eef4fe] text-[#1241a6]">
                  <Building2 size={22} />
                </span>
                <div>
                  <h1 className="text-title font-bold text-ink">{project.name}</h1>
                  <p className="mt-0.5 font-mono text-caption font-semibold text-primary-700">
                    {project.code}
                  </p>
                </div>
              </div>
              <StatusBadge label="Active Site" tone="success" size="sm" />
            </div>

            {/* Site Address & Geo */}
            <div className="mt-4 space-y-2 rounded-xl bg-neutral-50 p-3 text-caption">
              <div className="flex items-start gap-2 text-ink">
                <MapPin size={15} className="mt-0.5 shrink-0 text-neutral-500" />
                <span>
                  {project.location.line1}, {project.location.taluka},{' '}
                  {project.location.district} - {project.location.pincode}
                </span>
              </div>
              <div className="flex items-center gap-2 text-ink">
                <User size={15} className="shrink-0 text-neutral-500" />
                <span>
                  Site In-charge:{' '}
                  <strong className="text-ink font-semibold">
                    {user?.fullName || 'Aniket Deshmukh'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Quick Action Buttons for this Site */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                variant="primary"
                size="sm"
                fullWidth
                leftIcon={<Search size={14} />}
                onClick={() => navigate(ROUTES.stockPoints)}
              >
                Order Minerals
              </Button>
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                leftIcon={<QrCode size={14} />}
                onClick={() => navigate(ROUTES.receive)}
              >
                Receive Material
              </Button>
            </div>
          </div>

          {/* 2. Mineral Requirement & Consumption Tracker */}
          <div>
            <SectionHeader title="Material Consumption & Quota" />
            <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs space-y-4">
              {/* Item 1: River Sand */}
              <div>
                <div className="flex items-center justify-between text-body-sm">
                  <span className="font-semibold text-ink">River Sand</span>
                  <span className="text-caption font-bold text-neutral-700">
                    12 Brass <span className="font-normal text-neutral-500">/ 20 Brass (60%)</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full rounded-full bg-[#1241a6]" style={{ width: '60%' }} />
                </div>
              </div>

              {/* Item 2: Basalt Stone */}
              <div>
                <div className="flex items-center justify-between text-body-sm">
                  <span className="font-semibold text-ink">Basalt Stone / Aggregate</span>
                  <span className="text-caption font-bold text-neutral-700">
                    500 Brass <span className="font-normal text-neutral-500">/ 600 Brass (83%)</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full rounded-full bg-[#1241a6]" style={{ width: '83%' }} />
                </div>
              </div>

              {/* Item 3: Murum */}
              <div>
                <div className="flex items-center justify-between text-body-sm">
                  <span className="font-semibold text-ink">Murum / Soil</span>
                  <span className="text-caption font-bold text-neutral-700">
                    350 Brass <span className="font-normal text-neutral-500">/ 400 Brass (87%)</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full rounded-full bg-[#1241a6]" style={{ width: '87%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Deliveries & DigiTP Passes for this Site */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <SectionHeader title="Site DigiTP Passes & Deliveries" />
              <button
                type="button"
                onClick={() => navigate(`${ROUTES.activity}?tab=live`)}
                className="text-caption font-semibold text-primary-700 hover:text-primary-900"
              >
                View Activity
              </button>
            </div>

            <div className="space-y-3">
              {/* Delivery 1: In Transit */}
              <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="flex size-6 items-center justify-center rounded-md bg-[#eef4fe] text-[#1241a6]">
                      <FileCheck size={14} />
                    </span>
                    <span className="text-body-sm font-bold text-[#1241a6]">
                      DigiTP: <span className="font-mono text-ink">DTP-2024-8842</span>
                    </span>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-[#f4eafc] px-2.5 py-0.5 text-caption font-semibold text-[#7e22ce]">
                    In Transit
                  </span>
                </div>

                <div className="mt-2.5 flex items-baseline justify-between text-caption">
                  <span className="font-semibold text-ink">River Sand</span>
                  <span className="tabular font-bold text-ink">12 Brass</span>
                </div>

                <p className="mt-1 text-caption text-neutral-500">
                  Vehicle: <strong className="text-ink">MH-15-BN-4402</strong> (Nitin Wagh)
                </p>

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

              {/* Delivery 2: Pass Issued */}
              <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="flex size-6 items-center justify-center rounded-md bg-[#eef4fe] text-[#1241a6]">
                      <FileCheck size={14} />
                    </span>
                    <span className="text-body-sm font-bold text-[#1241a6]">
                      DigiTP: <span className="font-mono text-ink">DTP-2024-7931</span>
                    </span>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-[#e0f2fe] px-2.5 py-0.5 text-caption font-semibold text-[#0369a1]">
                    Pass Issued
                  </span>
                </div>

                <div className="mt-2.5 flex items-baseline justify-between text-caption">
                  <span className="font-semibold text-ink">Basalt Stone</span>
                  <span className="tabular font-bold text-ink">500 Brass</span>
                </div>

                <p className="mt-1 text-caption text-neutral-500">
                  Quarry: <strong className="text-ink">Shree Ganesh Stone Quarry</strong>
                </p>

                <div className="mt-3 flex items-center justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<FileCheck size={14} />}
                    onClick={() => setIsDigiTpModalOpen(true)}
                  >
                    View DigiTP
                  </Button>
                </div>
              </div>

              {/* Delivery 3: Delivered */}
              <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-body-sm font-bold text-[#1241a6]">
                    DigiTP: DTP-2024-6420
                  </span>
                  <span className="inline-flex items-center rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-caption font-semibold text-[#15803d]">
                    Delivered & Verified
                  </span>
                </div>

                <div className="mt-2.5 flex items-baseline justify-between text-caption">
                  <span className="font-semibold text-ink">Stone Aggregate</span>
                  <span className="tabular font-bold text-ink">150 Brass</span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2 text-caption">
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
            </div>
          </div>

          {/* 4. Compliance Certificate Download */}
          <div className="rounded-2xl border border-[#d6e5f8] bg-[#eef5fd] p-4 text-center">
            <h2 className="text-body font-bold text-[#134280]">
              Official Site Compliance Certificate
            </h2>
            <p className="mt-1 text-caption text-neutral-600">
              Download the certified statement of all minor minerals received under official DigiTP permits.
            </p>
            <div className="mt-3">
              <Button
                variant="primary"
                fullWidth
                loading={isDownloadingCert}
                leftIcon={<Download size={15} />}
                onClick={handleDownloadCertificate}
              >
                Download Mineral Certificate (PDF)
              </Button>
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
}
