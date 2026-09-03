import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Landmark, MapPin, Check } from 'lucide-react';
import type { GeoPoint, ProjectCategory, ProjectOwnershipType } from '@/domain';
import { Button, Input, Select, Surface, cn } from '@/design-system';
import { locationRepository, projectRepository, useAsync } from '@/data';
import { useCurrentOrganization } from '@/state';
import { ROUTES, Screen } from '@/navigation';
import { LocationMapOverlay } from '../excavation/LocationMapOverlay';

const STATE_CENTRE: GeoPoint = { latitude: 19.7515, longitude: 75.7139 };

const GOVT_DEPARTMENTS = [
  { value: 'Public Works Department (PWD)', label: 'Public Works Department (PWD)' },
  { value: 'Water Resources Department (WRD / Irrigation)', label: 'Water Resources Department (WRD / Irrigation)' },
  { value: 'Maharashtra State Road Development Corp (MSRDC)', label: 'MSRDC' },
  { value: 'Zilla Parishad (ZP Infrastructure)', label: 'Zilla Parishad (ZP)' },
  { value: 'CIDCO / MIDC', label: 'CIDCO / MIDC' },
  { value: 'Maha-Metro / Railways', label: 'Maha-Metro / Railways' },
  { value: 'National Highways Authority of India (NHAI)', label: 'NHAI' },
  { value: 'Forest Department', label: 'Forest Department' },
  { value: 'OTHER', label: 'Other Government Department' },
];

const URBAN_CITIES_BY_DISTRICT: Record<string, string[]> = {
  PUN: ['Pune City (PMC)', 'Pimpri-Chinchwad (PCMC)', 'Hinjawadi IT Corridor', 'Pune Cantonment', 'Khadki', 'Baramati Urban'],
  MUM: ['Mumbai City', 'Colaba', 'Nariman Point', 'Dadar', 'Worli', 'Fort'],
  MSU: ['Mumbai Suburban', 'Andheri', 'Bandra', 'Kurla', 'Borivali', 'Malad', 'Powai'],
  THA: ['Thane City (TMC)', 'Navi Mumbai (NMMC)', 'Kalyan-Dombivli (KDMC)', 'Mira-Bhayandar', 'Ulhasnagar', 'Bhiwandi'],
  NAG: ['Nagpur City (NMC)', 'Kamptee Urban', 'Hingna Industrial Hub', 'Nagpur West Urban', 'Katol Urban'],
  NAS: ['Nashik City (NMC)', 'Deolali Cantonment', 'Malegaon Urban', 'Sinnar Industrial Area', 'Ozar Urban'],
  CSN: ['Chhatrapati Sambhajinagar City (CSMC)', 'Waluj MIDC Area', 'Shendra Industrial Town', 'Paithan Urban'],
  AHI: ['Ahilyanagar City (AMC)', 'Shirdi Urban Area', 'Sangamner City', 'Kopargaon Urban'],
};

const DEFAULT_URBAN_CITIES = [
  'City Municipal Corporation',
  'Industrial Town / MIDC Hub',
  'Cantonment / Smart City Zone',
  'Suburban Town Council',
];

/**
 * CREATE / REGISTER PROJECT SCREEN
 *
 * Implements user's exact specification:
 * 1) Project name starting for the user to input
 * 2) Project type: Private / Government
 * 3) If Government selected -> Department field appears
 * 4) Work order no (input field)
 * 5) Site address input field (with location icon on right hand side to select location on map)
 * 6) District dropdown input
 * 7) Taluka dropdown input
 * 8) Urban / Rural selection:
 *    - If Urban -> City dropdown
 *    - If Rural -> Village dropdown
 */
export function CreateProjectScreen() {
  const navigate = useNavigate();
  const organization = useCurrentOrganization();

  /* Form States */
  const [name, setName] = useState('');
  const [projectType, setProjectType] = useState<ProjectOwnershipType>('PRIVATE');
  const [department, setDepartment] = useState('');
  const [customDepartment, setCustomDepartment] = useState('');
  const [workOrderNo, setWorkOrderNo] = useState('');
  const [line1, setLine1] = useState('');
  const [districtCode, setDistrictCode] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [talukaCode, setTalukaCode] = useState('');
  const [talukaName, setTalukaName] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('RURAL');
  const [city, setCity] = useState('');
  const [villageCode, setVillageCode] = useState('');
  const [villageName, setVillageName] = useState('');
  const [pincode] = useState('411001');
  const [siteGeo, setSiteGeo] = useState<GeoPoint | null>(null);

  const [mapOpen, setMapOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  /* Async location masters */
  const districts = useAsync(() => locationRepository.listDistricts(), []);
  const talukas = useAsync(
    () => (districtCode ? locationRepository.listTalukas(districtCode) : Promise.resolve([])),
    [districtCode],
  );
  const villages = useAsync(
    () => (talukaCode ? locationRepository.listVillages(talukaCode) : Promise.resolve([])),
    [talukaCode],
  );

  const selectedTaluka = talukas.data?.find((t) => t.code === talukaCode);
  const selectedDistrict = districts.data?.find((d) => d.code === districtCode);
  const centre = selectedTaluka?.geo ?? selectedDistrict?.geo ?? STATE_CENTRE;

  const cityOptions = districtCode && URBAN_CITIES_BY_DISTRICT[districtCode]
    ? URBAN_CITIES_BY_DISTRICT[districtCode]
    : DEFAULT_URBAN_CITIES;

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Enter the project name.';
    if (projectType === 'GOVERNMENT') {
      const activeDept = department === 'OTHER' ? customDepartment : department;
      if (!activeDept.trim()) errs.department = 'Select or enter the government department.';
    }
    if (!workOrderNo.trim()) errs.workOrderNo = 'Enter the work order / sanction order number.';
    if (!line1.trim()) errs.line1 = 'Enter the site address.';
    if (!districtCode) errs.districtCode = 'Select a district.';
    if (!talukaCode) errs.talukaCode = 'Select a taluka.';

    if (category === 'URBAN') {
      if (!city.trim()) errs.city = 'Select a city.';
    } else {
      if (!villageCode) errs.villageCode = 'Select a village.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!organization) return;
    if (!validate()) return;

    setSubmitting(true);
    try {
      const effectiveDept =
        projectType === 'GOVERNMENT'
          ? (department === 'OTHER' ? customDepartment.trim() : department.trim())
          : undefined;

      const project = await projectRepository.createForOrganization(organization.id, {
        name: name.trim(),
        code: `PROJ-${organization.id.slice(0, 4).toUpperCase()}-${String(Date.now()).slice(-4)}`,
        projectType,
        department: effectiveDept,
        workOrderNumber: workOrderNo.trim(),
        category,
        city: category === 'URBAN' ? city.trim() : undefined,
        village: category === 'RURAL' ? villageName.trim() : undefined,
        location: {
          line1: line1.trim(),
          taluka: talukaName || talukaCode,
          district: districtName || districtCode,
          state: 'Maharashtra',
          pincode: pincode.trim() || '400001',
        },
        geo: siteGeo ?? centre,
      });

      navigate(ROUTES.projectDetails(project.id), { replace: true });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen title="Create project" onBack>
      <div className="space-y-4 pb-12">
        {/* Banner */}
        <Surface className="border-y border-line px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 shadow-2xs">
              <Building2 size={20} />
            </div>
            <div>
              <p className="text-overline uppercase tracking-wider text-ink-muted">Project Registration</p>
              <h2 className="text-title-lg font-bold text-ink">Create project</h2>
            </div>
          </div>
          <p className="mt-2 text-body-sm text-ink-secondary">
            Register your project to group packages, order minerals, and track work orders seamlessly.
          </p>
        </Surface>

        {/* Form Container */}
        <Surface className="border-y border-line px-4 py-5 space-y-4">
          {/* 1) Project Name */}
          <Input
            label="Project name"
            required
            value={name}
            placeholder="e.g. Patel Quarry Site / Highway Package 2"
            {...(errors.name ? { error: errors.name } : {})}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((prev) => ({ ...prev, name: '' }));
            }}
          />

          {/* 2) Project Type: Private vs Government */}
          <div>
            <label className="mb-1.5 block text-caption font-semibold text-ink">
              Project type <span className="text-danger-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setProjectType('PRIVATE');
                  setDepartment('');
                  setErrors((prev) => ({ ...prev, department: '' }));
                }}
                className={cn(
                  'flex h-11 items-center justify-center gap-2 rounded-xl border text-body-sm font-semibold transition-all',
                  projectType === 'PRIVATE'
                    ? 'border-primary-600 bg-primary-50/70 text-primary-700 shadow-xs ring-1 ring-primary-300/40'
                    : 'border-line bg-surface text-ink-muted hover:border-neutral-300',
                )}
              >
                <Building2 size={16} />
                Private
              </button>

              <button
                type="button"
                onClick={() => setProjectType('GOVERNMENT')}
                className={cn(
                  'flex h-11 items-center justify-center gap-2 rounded-xl border text-body-sm font-semibold transition-all',
                  projectType === 'GOVERNMENT'
                    ? 'border-primary-600 bg-primary-50/70 text-primary-700 shadow-xs ring-1 ring-primary-300/40'
                    : 'border-line bg-surface text-ink-muted hover:border-neutral-300',
                )}
              >
                <Landmark size={16} />
                Government
              </button>
            </div>
          </div>

          {/* 3) Department (Only if Government is chosen) */}
          {projectType === 'GOVERNMENT' && (
            <div className="rounded-xl border border-primary-100 bg-primary-50/30 p-3.5 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <Select
                label="Department"
                required
                placeholder="Select government department"
                value={department}
                options={GOVT_DEPARTMENTS}
                {...(errors.department ? { error: errors.department } : {})}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setErrors((prev) => ({ ...prev, department: '' }));
                }}
              />

              {department === 'OTHER' && (
                <Input
                  label="Specify Department Name"
                  required
                  placeholder="e.g. Maharashtra Metro Rail Corporation"
                  value={customDepartment}
                  onChange={(e) => setCustomDepartment(e.target.value)}
                />
              )}
            </div>
          )}

          {/* 4) Work Order No */}
          <Input
            label="Work order no"
            required
            value={workOrderNo}
            placeholder="e.g. CE/PWD/2026/WO-4819"
            {...(errors.workOrderNo ? { error: errors.workOrderNo } : {})}
            onChange={(e) => {
              setWorkOrderNo(e.target.value);
              setErrors((prev) => ({ ...prev, workOrderNo: '' }));
            }}
          />

          {/* 5) Site Address Input with Location Icon on Right */}
          <Input
            label="Site address"
            required
            value={line1}
            placeholder="Plot, building, road or street address"
            {...(errors.line1 ? { error: errors.line1 } : {})}
            onChange={(e) => {
              setLine1(e.target.value);
              setErrors((prev) => ({ ...prev, line1: '' }));
            }}
            rightSlot={
              <button
                type="button"
                aria-label="Select location on map"
                title="Select location on map"
                onClick={() => setMapOpen(true)}
                className="flex size-8 items-center justify-center rounded-lg text-primary-700 hover:bg-primary-100/70 transition-colors"
              >
                <MapPin size={18} />
              </button>
            }
          />

          {/* 6) District Dropdown */}
          <Select
            label="District"
            required
            placeholder="Select a district"
            value={districtCode}
            options={(districts.data ?? []).map((d) => ({ value: d.code, label: d.name }))}
            {...(errors.districtCode ? { error: errors.districtCode } : {})}
            onChange={(e) => {
              const selected = districts.data?.find((d) => d.code === e.target.value);
              setDistrictCode(selected?.code ?? '');
              setDistrictName(selected?.name ?? '');
              setTalukaCode('');
              setTalukaName('');
              setVillageCode('');
              setVillageName('');
              setCity('');
              setErrors((prev) => ({ ...prev, districtCode: '' }));
            }}
          />

          {/* 7) Taluka Dropdown */}
          <Select
            label="Taluka"
            required
            disabled={!districtCode}
            placeholder={districtCode ? 'Select a taluka' : 'Select a district first'}
            value={talukaCode}
            options={(talukas.data ?? []).map((t) => ({ value: t.code, label: t.name }))}
            {...(errors.talukaCode ? { error: errors.talukaCode } : {})}
            onChange={(e) => {
              const selected = talukas.data?.find((t) => t.code === e.target.value);
              setTalukaCode(selected?.code ?? '');
              setTalukaName(selected?.name ?? '');
              setVillageCode('');
              setVillageName('');
              setCity('');
              setErrors((prev) => ({ ...prev, talukaCode: '' }));
            }}
          />

          {/* 8) Urban / Rural Selection */}
          <div className="pt-1">
            <label className="mb-1.5 block text-caption font-semibold text-ink">
              Area Classification <span className="text-danger-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                onClick={() => {
                  setCategory('URBAN');
                  setVillageCode('');
                  setVillageName('');
                }}
                className={cn(
                  'flex h-11 items-center justify-center rounded-xl border text-body-sm font-semibold transition-all',
                  category === 'URBAN'
                    ? 'border-primary-600 bg-primary-50/70 text-primary-700 shadow-xs ring-1 ring-primary-300/40'
                    : 'border-line bg-surface text-ink-muted hover:border-neutral-300',
                )}
              >
                Urban
              </button>

              <button
                type="button"
                onClick={() => {
                  setCategory('RURAL');
                  setCity('');
                }}
                className={cn(
                  'flex h-11 items-center justify-center rounded-xl border text-body-sm font-semibold transition-all',
                  category === 'RURAL'
                    ? 'border-primary-600 bg-primary-50/70 text-primary-700 shadow-xs ring-1 ring-primary-300/40'
                    : 'border-line bg-surface text-ink-muted hover:border-neutral-300',
                )}
              >
                Rural
              </button>
            </div>

            {/* If Urban -> City dropdown */}
            {category === 'URBAN' ? (
              <Select
                label="City"
                required
                placeholder={districtCode ? 'Select city / municipal area' : 'Select district first'}
                value={city}
                options={cityOptions.map((c) => ({ value: c, label: c }))}
                {...(errors.city ? { error: errors.city } : {})}
                onChange={(e) => {
                  setCity(e.target.value);
                  setErrors((prev) => ({ ...prev, city: '' }));
                }}
              />
            ) : (
              /* Else Rural -> Village dropdown */
              <Select
                label="Village"
                required
                disabled={!talukaCode}
                placeholder={talukaCode ? 'Select a village' : 'Select a taluka first'}
                value={villageCode}
                options={(villages.data ?? []).map((v) => ({ value: v.code, label: v.name }))}
                {...(errors.villageCode ? { error: errors.villageCode } : {})}
                onChange={(e) => {
                  const selected = villages.data?.find((v) => v.code === e.target.value);
                  setVillageCode(selected?.code ?? '');
                  setVillageName(selected?.name ?? '');
                  setErrors((prev) => ({ ...prev, villageCode: '' }));
                }}
              />
            )}
          </div>
        </Surface>

        {/* Submit Button */}
        <div className="px-4">
          <Button
            size="lg"
            fullWidth
            onClick={handleSubmit}
            loading={submitting}
            leftIcon={<Check size={18} />}
          >
            Create project
          </Button>
        </div>
      </div>

      {/* Interactive Map Picker Overlay */}
      {mapOpen && (
        <LocationMapOverlay
          centre={siteGeo ?? centre}
          value={siteGeo}
          onChange={setSiteGeo}
          onClose={() => setMapOpen(false)}
          onSave={(point) => {
            setSiteGeo(point);
            if (!line1.trim()) {
              setLine1(`Project Site (${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)})`);
            }
            void locationRepository.resolveNearest(point).then((resolved) => {
              if (resolved.district && !districtCode) {
                setDistrictCode(resolved.district.code);
                setDistrictName(resolved.district.name);
              }
              if (resolved.taluka && !talukaCode) {
                setTalukaCode(resolved.taluka.code);
                setTalukaName(resolved.taluka.name);
              }
              if (resolved.village && category === 'RURAL' && !villageCode) {
                setVillageCode(resolved.village.code);
                setVillageName(resolved.village.name);
              }
            });
            setMapOpen(false);
          }}
        />
      )}
    </Screen>
  );
}
