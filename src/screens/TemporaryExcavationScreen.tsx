import { Screen } from '@/navigation';
import { ScreenPlaceholder } from './_scaffold/ScreenPlaceholder';

/**
 * ORGANIZATION ONLY.
 *
 * Protected by the TEMPORARY_EXCAVATION capability at the route level, so a
 * Normal Consumer cannot reach it even by typing the URL. See RoleGuard.
 */
export function TemporaryExcavationScreen() {
  return (
    <Screen title="Temporary Excavation" onBack>
      <ScreenPlaceholder
        increment="Increment 7 — Organization compliance workflow"
        purpose="What is the status of my excavation applications, and what needs action?"
        contents={[
          'Application list with status and items requiring attention',
          'New Application flow',
          'Application status and lifecycle',
          'Presented as an operational module, not a promotional banner',
          'The only application type in scope — no other portal application types',
        ]}
      />
    </Screen>
  );
}
