import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Package, Project } from '@/domain';

/**
 * ORGANIZATION CONTEXT — the Project and Package the user is operating inside.
 *
 * THE PRODUCT RULE THIS EXISTS TO ENFORCE:
 *   "Do not repeatedly ask the user to select a Project or Package when that
 *    information is already known."
 *
 * Once a user drills Projects → Project → Package, that scope is held here and
 * travels into discovery, enquiry, order, tracking, receiving, inventory and
 * consumption. Those flows READ this context; they never ask for it again.
 *
 * Selecting a different project clears the package, because a package only has
 * meaning inside its own project.
 *
 * Only ever populated for ORGANIZATION users. Normal Consumers have no
 * hierarchy, so this store stays empty for them and nothing reads it.
 *
 * Resolved entities are stored rather than bare ids so the context strip can
 * render a name without an async lookup on every screen.
 */
interface OrganizationContextState {
  project: Project | null;
  activePackage: Package | null;

  setProject: (project: Project) => void;
  setPackage: (activePackage: Package) => void;
  clearPackage: () => void;
  clear: () => void;
}

export const useOrganizationContextStore = create<OrganizationContextState>()(
  persist(
    (set, get) => ({
      project: null,
      activePackage: null,

      setProject: (project) => {
        // Switching project invalidates any package selected under the old one.
        const current = get().project;
        const packageStillValid = current?.id === project.id;
        set({
          project,
          activePackage: packageStillValid ? get().activePackage : null,
        });
      },

      setPackage: (activePackage) => set({ activePackage }),
      clearPackage: () => set({ activePackage: null }),
      clear: () => set({ project: null, activePackage: null }),
    }),
    { name: 'mahakhanij.organization-context' },
  ),
);

export const useActiveProject = (): Project | null =>
  useOrganizationContextStore((state) => state.project);

export const useActivePackage = (): Package | null =>
  useOrganizationContextStore((state) => state.activePackage);
