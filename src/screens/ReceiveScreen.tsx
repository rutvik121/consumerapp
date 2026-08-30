import { Screen } from '@/navigation';
import { ScreenPlaceholder } from './_scaffold/ScreenPlaceholder';

export function ReceiveScreen() {
  return (
    <Screen title="Receive mineral" onBack>
      <ScreenPlaceholder
        increment="Increment 5 — Receiving"
        purpose="A vehicle has arrived. Is this the right load, and how much actually came?"
        contents={['Scan QR to resolve the transport permit',
          'Validate the transaction, vehicle and destination',
          'Review dispatched quantity, then enter what actually arrived',
          'Surface any discrepancy prominently, never buried',
          'Confirm receipt and update inventory']}
      />
    </Screen>
  );
}
