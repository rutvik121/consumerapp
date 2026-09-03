import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Phone, Boxes, Check } from 'lucide-react';
import { Button, Input, Select, Surface } from '@/design-system';
import { packageRepository, useAsync } from '@/data';
import { useCurrentOrganization } from '@/state';
import { ROUTES, Screen } from '@/navigation';

export function RegisterSupervisorScreen() {
  const navigate = useNavigate();
  const organization = useCurrentOrganization();

  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [assignedPackageId, setAssignedPackageId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  /* Load available packages for the organization */
  const packages = useAsync(
    () => (organization ? packageRepository.listByOrganization(organization.id) : Promise.resolve([])),
    [organization?.id],
  );

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Enter supervisor name.';
    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      errs.mobileNumber = 'Enter a valid 10-digit mobile number.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await packageRepository.createSupervisor({
        name: name.trim(),
        mobileNumber: mobileNumber.replace(/\D/g, ''),
        ...(assignedPackageId ? { assignedPackageId } : {}),
      });

      navigate(ROUTES.supervisors, { replace: true });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen title="Register supervisor" onBack>
      <div className="space-y-4 pb-12">
        {/* Banner */}
        <Surface className="border-y border-line px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 shadow-2xs">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-overline uppercase tracking-wider text-ink-muted">Team Management</p>
              <h2 className="text-title-lg font-bold text-ink">Register supervisor</h2>
            </div>
          </div>
          <p className="mt-2 text-body-sm text-ink-secondary">
            Add a site supervisor to authorize on-site deliveries, verify arriving vehicles, and oversee material receiving.
          </p>
        </Surface>

        {/* Form Container */}
        <Surface className="border-y border-line px-4 py-5 space-y-4">
          {/* 1. Supervisor Name */}
          <Input
            label="Supervisor name"
            required
            value={name}
            placeholder="e.g. Anand R. Patil"
            {...(errors.name ? { error: errors.name } : {})}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((prev) => ({ ...prev, name: '' }));
            }}
          />

          {/* 2. Contact Detail */}
          <Input
            label="Supervisor contact detail"
            required
            inputMode="numeric"
            maxLength={10}
            leftIcon={<Phone size={16} className="text-ink-muted" />}
            value={mobileNumber}
            placeholder="98XXXXXXXX"
            hint="10-digit mobile number for SMS and delivery alerts"
            {...(errors.mobileNumber ? { error: errors.mobileNumber } : {})}
            onChange={(e) => {
              setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
              setErrors((prev) => ({ ...prev, mobileNumber: '' }));
            }}
          />

          {/* 3. Assigned to Package Dropdown (Optional) */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Boxes size={15} className="text-primary-600" />
              <label className="text-label text-ink-secondary">
                Assigned to package <span className="text-caption text-ink-muted font-normal">(optional)</span>
              </label>
            </div>
            <Select
              placeholder="Select a package (optional)"
              value={assignedPackageId}
              options={[
                { value: '', label: 'Unassigned (Assign later)' },
                ...(packages.data ?? []).map((pkg) => ({
                  value: pkg.id,
                  label: `${pkg.name} (${pkg.code})`,
                })),
              ]}
              onChange={(e) => setAssignedPackageId(e.target.value)}
            />
            <p className="mt-1 text-caption text-ink-muted">
              You can assign this supervisor to an active package now or link them later during package creation.
            </p>
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
            Register supervisor
          </Button>
        </div>
      </div>
    </Screen>
  );
}
