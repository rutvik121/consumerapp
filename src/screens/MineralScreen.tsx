import { Screen } from '@/navigation';
import { copy } from '@/content';
import { ScreenPlaceholder } from './_scaffold/ScreenPlaceholder';

/** NORMAL CONSUMER ONLY — the flat equivalent of the Projects tab. */
export function MineralScreen() {
  return (
    <Screen title={copy.nav.mineral}>
      <ScreenPlaceholder
        increment="Increment 3 — Mineral acquisition"
        purpose="Where can I get the mineral I need?"
        contents={[
          'Find Stock Point — search, list, map, lightweight filters',
          'Stock Point Details — availability, operational status, source quarry',
          'Mineral Enquiry — never "Book Mineral", never a marketplace checkout',
          'Enquiry status and lifecycle',
          'No project or package fields on any of it',
        ]}
      />
    </Screen>
  );
}
