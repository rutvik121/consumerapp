import { Screen } from '@/navigation';
import { ScreenPlaceholder } from './_scaffold/ScreenPlaceholder';

export function InventoryScreen() {
  return (
    <Screen title="Inventory" onBack>
      <ScreenPlaceholder
        increment="Increment 6 — Inventory and consumption"
        purpose="What do I have, and what is left?"
        contents={['Received minus consumed equals available',
          'Held per package for organizations, flat for consumers',
          'Record consumption against a balance',
          'Remaining quantity recalculated immediately']}
      />
    </Screen>
  );
}
