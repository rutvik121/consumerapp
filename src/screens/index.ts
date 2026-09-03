/**
 * SCREENS — one file per route.
 *
 * RULES:
 *   1. A screen composes design-system components; it does not define new
 *      visual patterns. If something is missing, add it to the design system.
 *   2. A screen reads data through repositories, never from fixtures.
 *   3. A screen reads product rules from @/rules; it does not restate them.
 *   4. A screen reads context from useOperatingContext(); it does not ask the
 *      user for context that is already known.
 *
 * `_scaffold/` holds honest markers for routes not yet built. It disappears
 * once every screen exists.
 */
export {
  SplashScreen,
  WelcomeScreen,
  LoginScreen,
  OtpScreen,
  RegisterScreen,
} from './auth';

export { HomeScreen } from './HomeScreen';
export {
  OrganizationHomeScreen,
  ProjectsScreen,
  ProjectDetailsScreen,
  CreateProjectScreen,
  CreatePackageScreen,
  PackageDetailsScreen,
  RegisterSupervisorScreen,
  SupervisorsScreen,
} from './organization';

export { StockPointMapScreen, StockPointDetailsScreen } from './discovery';
export {
  CreateEnquiryScreen,
  EnquiriesScreen,
  EnquiryDetailsScreen,
} from './enquiry';
export { ConsumerActivityScreen } from './activity';
export { ReceiveScreen, ReceiveDeliveryScreen } from './receiving';
export { InventoryScreen, InventoryBalanceScreen } from './inventory';
export { MineralScreen } from './MineralScreen';
export { ConsumerProjectsScreen } from './consumer/ConsumerProjectsScreen';
export { ConsumerProjectDetailsScreen } from './consumer/ConsumerProjectDetailsScreen';
export { ConsumerProjectRegistrationScreen } from './consumer/ConsumerProjectRegistrationScreen';
export { ConsumerReportsScreen } from './reports';
export {
  OrdersScreen,
  OrderDetailsScreen,
  DeliveryTrackingScreen,
  LiveVehicleTrackingScreen,
} from './orders';
export { MoreScreen } from './MoreScreen';
export {
  TemporaryExcavationScreen,
  ApplicationDetailsScreen,
  NewApplicationScreen,
  PaymentScreen,
} from './excavation';
export { NotFoundScreen } from './NotFoundScreen';
