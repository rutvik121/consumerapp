import { Screen } from '@/navigation';
import { copy } from '@/content';
import { ScreenPlaceholder } from './_scaffold/ScreenPlaceholder';

/**
 * Shared by both roles. The screen is built once; role only determines whether
 * project and package context is attached and displayed.
 */
export function OrdersScreen() {
  return (
    <Screen title={copy.nav.orders}>
      <ScreenPlaceholder
        increment="Increment 4 — Orders and transport"
        purpose="What have I ordered, and where has it reached?"
        contents={[
          'Order list — mineral, quantity, source, dispatch and receiving status',
          'Order Details — enquiry reference, transporter, vehicle, deliveries',
          'Tracking — vehicle, mineral, quantity, source, destination, current status, last update',
          'Map supports tracking; it is never the only source of information',
          'Project and package shown for organizations, absent for consumers',
        ]}
      />
    </Screen>
  );
}
