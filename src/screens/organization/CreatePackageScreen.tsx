import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Boxes, MapPin } from 'lucide-react';
import { Button, Input, Surface } from '@/design-system';
import { packageRepository, projectRepository } from '@/data';
import { useCurrentOrganization } from '@/state';
import { ROUTES, Screen } from '@/navigation';

export function CreatePackageScreen() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const organization = useCurrentOrganization();

  const [name, setName] = useState('');
  const [line1, setLine1] = useState('');
  const [taluka, setTaluka] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!organization || !projectId) return;
    if (!name.trim() || !line1.trim() || !taluka.trim() || !district.trim() || !pincode.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      const project = await projectRepository.getById(projectId);
      if (!project) return;

      await packageRepository.create(project.id, organization.id, {
        name: name.trim(),
        code: `PKG-${project.id.slice(-4).toUpperCase()}-${String(Date.now()).slice(-4)}`,
        siteAddress: {
          line1: line1.trim(),
          taluka: taluka.trim(),
          district: district.trim(),
          state: state.trim() || 'Maharashtra',
          pincode: pincode.trim(),
        },
        siteGeo: {
          latitude: Number(latitude || 0),
          longitude: Number(longitude || 0),
        },
      });

      navigate(ROUTES.projectDetails(project.id), { replace: true });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen title="Create package" onBack>
      <div className="space-y-4 pb-8">
        <Surface className="border-y border-line px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Boxes size={18} />
            </div>
            <div>
              <p className="text-overline uppercase text-ink-muted">Package</p>
              <h2 className="text-title-lg text-ink">Create a package</h2>
            </div>
          </div>
          <p className="mt-3 text-body text-ink-secondary">
            Add a package site so operations, receiving, and inventory can be tracked accurately within the project.
          </p>
        </Surface>

        <Surface className="border-y border-line px-4 py-4">
          <div className="space-y-4">
            <Input
              label="Package name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. North excavation block"
            />
            <Input
              label="Site address"
              value={line1}
              onChange={(event) => setLine1(event.target.value)}
              placeholder="Plot, building or street address"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Taluka"
                value={taluka}
                onChange={(event) => setTaluka(event.target.value)}
                placeholder="Taluka"
              />
              <Input
                label="District"
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
                placeholder="District"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="State"
                value={state}
                onChange={(event) => setState(event.target.value)}
                placeholder="State"
              />
              <Input
                label="PIN code"
                value={pincode}
                onChange={(event) => setPincode(event.target.value)}
                placeholder="000000"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Latitude"
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
                placeholder="19.876"
              />
              <Input
                label="Longitude"
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
                placeholder="75.343"
              />
            </div>
          </div>
        </Surface>

        <Button
          size="lg"
          fullWidth
          leftIcon={<MapPin size={16} />}
          onClick={handleSubmit}
          loading={submitting}
        >
          Save package
        </Button>
      </div>
    </Screen>
  );
}
