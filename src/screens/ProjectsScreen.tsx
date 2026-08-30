import { Screen } from '@/navigation';
import { copy } from '@/content';
import { ScreenPlaceholder } from './_scaffold/ScreenPlaceholder';

/** ORGANIZATION ONLY — reached via the Projects tab, which consumers never see. */
export function ProjectsScreen() {
  return (
    <Screen title={copy.nav.projects}>
      <ScreenPlaceholder
        increment="Increment 2 — Organization structure"
        purpose="Which project am I working on?"
        contents={[
          'Project list — identity, location, status, package count, items needing attention',
          'Project Details → Package list',
          'Package Details as the operational entry point',
          'Selecting a package sets the operating context that travels into every downstream flow',
          'Assigned supervisor shown as read-only context only',
        ]}
      />
    </Screen>
  );
}
