import { Screen } from '@/navigation';
import { ScreenPlaceholder } from './_scaffold/ScreenPlaceholder';

export function EnquiriesScreen() {
  return (
    <Screen title="Enquiries" onBack>
      <ScreenPlaceholder
        increment="Increment 3 — Mineral acquisition"
        purpose="What have I asked for, and where has it reached?"
        contents={['Enquiry list with number, mineral, quantity, stock point, date and status',
          'Enquiry detail and lifecycle',
          'Project and package shown for organizations, absent for consumers',
          'Never framed as booking or checkout']}
      />
    </Screen>
  );
}
