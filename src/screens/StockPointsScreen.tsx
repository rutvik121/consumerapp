import { Screen } from '@/navigation';
import { ScreenPlaceholder } from './_scaffold/ScreenPlaceholder';

export function StockPointsScreen() {
  return (
    <Screen title="Find stock point" onBack>
      <ScreenPlaceholder
        increment="Increment 3 — Mineral acquisition"
        purpose="Where can I get the mineral I need, near this site?"
        contents={['Search, list and map views with lightweight filters',
          'Mineral, location, distance and availability filters',
          'Each result showing name, location, distance, available mineral and quantity',
          'Distance measured to the active package site, not to a generic location',
          'Stock Point Details, then Mineral Enquiry']}
      />
    </Screen>
  );
}
