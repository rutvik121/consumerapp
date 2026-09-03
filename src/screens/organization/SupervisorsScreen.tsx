import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Boxes, Phone, Plus, Search, ShieldCheck, UserCheck, Users } from 'lucide-react';
import type { SupervisorInfo } from '@/domain';
import { Button, Input, LoadingState, Surface, cn } from '@/design-system';
import { packageRepository, useAsync } from '@/data';
import { ROUTES, Screen } from '@/navigation';

export function SupervisorsScreen() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const supervisors = useAsync(() => packageRepository.listSupervisors(), []);

  const list = supervisors.data ?? [];
  const filtered = list.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.employeeCode.toLowerCase().includes(q) ||
      s.mobileNumber.includes(q) ||
      (s.assignedPackageName && s.assignedPackageName.toLowerCase().includes(q))
    );
  });

  return (
    <Screen
      title="Supervisors"
      onBack
      actions={
        <button
          type="button"
          onClick={() => navigate(ROUTES.registerSupervisor)}
          className="flex items-center gap-1 rounded-lg bg-primary-50 px-2.5 py-1.5 text-caption font-semibold text-primary-700 hover:bg-primary-100 transition-colors"
        >
          <Plus size={15} />
          Register
        </button>
      }
    >
      <div className="space-y-4 pb-12">
        {/* Top Summary Banner */}
        <Surface className="border-y border-line px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 shadow-2xs">
                <Users size={20} />
              </div>
              <div>
                <p className="text-overline uppercase tracking-wider text-ink-muted">Authorized Personnel</p>
                <h2 className="text-title-lg font-bold text-ink">
                  {list.length} Supervisor{list.length === 1 ? '' : 's'}
                </h2>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => navigate(ROUTES.registerSupervisor)}
            >
              Add New
            </Button>
          </div>
          <p className="mt-2 text-body-sm text-ink-secondary">
            Supervisors verify and approve mineral dispatches, driver DigiTP e-passes, and vehicle weighment at the package site.
          </p>
        </Surface>

        {/* Search Bar */}
        <div className="px-4">
          <Input
            value={searchQuery}
            placeholder="Search by name, ID or package..."
            leftIcon={<Search size={16} className="text-ink-muted" />}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Supervisor Cards List */}
        <div className="px-4 space-y-3">
          {supervisors.loading && <LoadingState variant="list" rows={4} />}

          {!supervisors.loading && filtered.length === 0 && (
            <div className="rounded-2xl border border-line bg-surface p-8 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-neutral-100 text-ink-muted">
                <UserCheck size={24} />
              </div>
              <h3 className="mt-3 text-body font-semibold text-ink">No supervisors found</h3>
              <p className="mt-1 text-caption text-ink-muted">
                {searchQuery ? 'Try changing your search keywords' : 'Register your first site supervisor to get started'}
              </p>
              {!searchQuery && (
                <div className="mt-4">
                  <Button
                    size="sm"
                    leftIcon={<Plus size={14} />}
                    onClick={() => navigate(ROUTES.registerSupervisor)}
                  >
                    Register supervisor
                  </Button>
                </div>
              )}
            </div>
          )}

          {filtered.map((supervisor: SupervisorInfo) => {
            const isAssigned = Boolean(supervisor.assignedPackageId || supervisor.assignedPackageName);

            return (
              <div
                key={supervisor.employeeCode}
                className="rounded-2xl border border-line bg-surface p-4 shadow-2xs hover:border-neutral-300 transition-all"
              >
                {/* Header: Name, Code, and Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-100/70 text-primary-700 font-bold text-body-sm">
                      {supervisor.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-body font-bold text-ink">{supervisor.name}</h3>
                        <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[11px] font-mono font-semibold text-ink-muted">
                          {supervisor.employeeCode}
                        </span>
                      </div>
                      <p className="flex items-center gap-1 text-caption text-ink-muted mt-0.5">
                        <Phone size={12} />
                        <span className="tabular font-medium">{supervisor.mobileNumber}</span>
                      </p>
                    </div>
                  </div>

                  <span className="flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-[11px] font-semibold text-success-700 border border-success-200/60">
                    <ShieldCheck size={12} />
                    Active
                  </span>
                </div>

                {/* Assigned Package Info */}
                <div className="mt-3 border-t border-line/60 pt-2.5 flex items-center justify-between text-body-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <Boxes size={14} className={isAssigned ? 'text-primary-600 shrink-0' : 'text-ink-muted shrink-0'} />
                    <span className="text-caption text-ink-muted shrink-0">Package:</span>
                    <span
                      className={cn(
                        'truncate text-caption font-semibold',
                        isAssigned ? 'text-primary-700' : 'text-amber-700 font-normal italic',
                      )}
                    >
                      {supervisor.assignedPackageName || 'Unassigned'}
                    </span>
                  </div>

                  <a
                    href={`tel:${supervisor.mobileNumber}`}
                    className="flex size-7 items-center justify-center rounded-full bg-neutral-100 text-ink hover:bg-primary-50 hover:text-primary-700 transition-colors shrink-0"
                    title={`Call ${supervisor.name}`}
                  >
                    <Phone size={13} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Screen>
  );
}
