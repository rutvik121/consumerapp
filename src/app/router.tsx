import { Outlet, Route, Routes } from 'react-router-dom';
import {
  AppShell,
  RequireNoSession,
  RequirePendingVerification,
  RequireSession,
  RoleGuard,
  ROUTES,
} from '@/navigation';
import {
  CreateEnquiryScreen,
  DeliveryTrackingScreen,
  LiveVehicleTrackingScreen,
  EnquiriesScreen,
  EnquiryDetailsScreen,
  ConsumerActivityScreen,
  HomeScreen,
  InventoryBalanceScreen,
  InventoryScreen,
  LoginScreen,
  MineralScreen,
  ConsumerProjectDetailsScreen,
  ConsumerProjectRegistrationScreen,
  ConsumerProjectsScreen,
  ConsumerReportsScreen,
  CreatePackageScreen,
  CreateProjectScreen,
  MoreScreen,
  NotFoundScreen,
  OrderDetailsScreen,
  OrdersScreen,
  OtpScreen,
  PackageDetailsScreen,
  ProjectDetailsScreen,
  ProjectsScreen,
  ReceiveDeliveryScreen,
  ReceiveScreen,
  RegisterScreen,
  SplashScreen,
  StockPointDetailsScreen,
  StockPointMapScreen,
  ApplicationDetailsScreen,
  NewApplicationScreen,
  PaymentScreen,
  RegisterSupervisorScreen,
  SupervisorsScreen,
  TemporaryExcavationScreen,
  WelcomeScreen,
} from '@/screens';
import { PersonaPickerScreen } from '@/prototype/PersonaPickerScreen';

/**
 * THE ROUTE TABLE.
 *
 * Three concentric layers:
 *
 *   AppShell                     device frame, role-driven navigation, overlays
 *   RequireSession /             a session is required — or forbidden
 *     RequireNoSession
 *   RoleGuard                    no capability → redirected home
 *
 * Access rules are never written here. Each guard names a capability, and the
 * capability matrix in @/rules/access decides — the same source navigation
 * reads, so a route and its tab can never disagree about who may see it.
 *
 * FOR THE FUTURE FLUTTER TEAM: this is the complete navigation graph for V1.
 * See docs/navigation-map.md.
 */
export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        {/* --- Splash resolves the persisted session and routes onward. --- */}
        <Route index element={<SplashScreen />} />

        {/* --- Authentication. Forbidden once a session exists. --- */}
        <Route
          element={
            <RequireNoSession>
              <Outlet />
            </RequireNoSession>
          }
        >
          <Route path={ROUTES.welcome} element={<WelcomeScreen />} />
          <Route path={ROUTES.login} element={<LoginScreen />} />
          <Route path={ROUTES.register} element={<RegisterScreen />} />

          {/* Needs a verification actually in progress, not just no session. */}
          <Route
            path={ROUTES.verify}
            element={
              <RequirePendingVerification>
                <OtpScreen />
              </RequirePendingVerification>
            }
          />

          {/* PROTOTYPE ONLY — a review shortcut past authentication. */}
          <Route path={ROUTES.personaPicker} element={<PersonaPickerScreen />} />
        </Route>

        {/* --- The authenticated application. --- */}
        <Route
          element={
            <RequireSession>
              <Outlet />
            </RequireSession>
          }
        >
          {/* Shared route, role-resolved content. One path, two experiences. */}
          <Route path={ROUTES.home} element={<HomeScreen />} />

          {/*
            ORGANIZATION ONLY — the hierarchy consumers do not have.
            Projects → Project Details → Package Details. Opening a project
            sets the active project; opening a package completes the operating
            context that every downstream operation inherits.
          */}
          <Route
            path={ROUTES.projects}
            element={
              <RoleGuard capability="VIEW_PROJECTS">
                <ProjectsScreen />
              </RoleGuard>
            }
          />
          <Route
            path={ROUTES.createProject}
            element={
              <RoleGuard capability="VIEW_PROJECTS">
                <CreateProjectScreen />
              </RoleGuard>
            }
          />
          <Route
            path={ROUTES.projectDetails()}
            element={
              <RoleGuard capability="VIEW_PROJECTS">
                <ProjectDetailsScreen />
              </RoleGuard>
            }
          />
          <Route
            path={ROUTES.createPackage()}
            element={
              <RoleGuard capability="VIEW_PACKAGES">
                <CreatePackageScreen />
              </RoleGuard>
            }
          />
          <Route
            path={ROUTES.packageDetails()}
            element={
              <RoleGuard capability="VIEW_PACKAGES">
                <PackageDetailsScreen />
              </RoleGuard>
            }
          />
          <Route
            path={ROUTES.supervisors}
            element={
              <RoleGuard capability="VIEW_PACKAGES">
                <SupervisorsScreen />
              </RoleGuard>
            }
          />
          <Route
            path={ROUTES.registerSupervisor}
            element={
              <RoleGuard capability="VIEW_PACKAGES">
                <RegisterSupervisorScreen />
              </RoleGuard>
            }
          />

          {/* NORMAL CONSUMER ONLY — the flat equivalent of Projects. */}
          <Route
            path={ROUTES.mineral}
            element={
              <RoleGuard capability="VIEW_MINERAL_TAB">
                <MineralScreen />
              </RoleGuard>
            }
          />
          <Route
            path={ROUTES.consumerProjects}
            element={
              <RoleGuard capability="VIEW_MINERAL_TAB">
                <ConsumerProjectsScreen />
              </RoleGuard>
            }
          />
          <Route
            path={ROUTES.consumerProjectRegistration}
            element={
              <RoleGuard capability="VIEW_MINERAL_TAB">
                <ConsumerProjectRegistrationScreen />
              </RoleGuard>
            }
          />
          <Route
            path={ROUTES.consumerProjectDetails()}
            element={
              <RoleGuard capability="VIEW_MINERAL_TAB">
                <ConsumerProjectDetailsScreen />
              </RoleGuard>
            }
          />

          {/*
            Shared operational flows. Built once for both roles — role only
            decides whether project/package context is attached and displayed.
          */}
          <Route path={ROUTES.orders} element={<OrdersScreen />} />
          <Route path={ROUTES.orderDetails()} element={<OrderDetailsScreen />} />
          <Route path={ROUTES.deliveryTracking()} element={<DeliveryTrackingScreen />} />
          <Route path={ROUTES.liveVehicleTracking()} element={<LiveVehicleTrackingScreen />} />
          {/*
            Mineral acquisition, in the order the product context fixes:
            Find Stock Point → Stock Point Details → Mineral Enquiry.
            Raising an enquiry is only reachable FROM a stock point, which is
            why its path is nested under one.
          */}
          <Route path={ROUTES.stockPoints} element={<StockPointMapScreen />} />
          <Route path={ROUTES.stockPointDetails()} element={<StockPointDetailsScreen />} />
          <Route path={ROUTES.createEnquiry()} element={<CreateEnquiryScreen />} />
          <Route path={ROUTES.enquiries} element={<EnquiriesScreen />} />
          <Route path={ROUTES.enquiryDetails()} element={<EnquiryDetailsScreen />} />
          <Route path={ROUTES.activity} element={<ConsumerActivityScreen />} />
          <Route path={ROUTES.receive} element={<ReceiveScreen />} />
          <Route path={ROUTES.receiveDelivery()} element={<ReceiveDeliveryScreen />} />
          <Route path={ROUTES.inventory} element={<InventoryScreen />} />
          <Route path={ROUTES.inventoryBalance()} element={<InventoryBalanceScreen />} />
          <Route path={ROUTES.reports} element={<ConsumerReportsScreen />} />

          {/*
            ORGANIZATION ONLY — the rule this guard exists for.
            A Normal Consumer typing /temporary-excavation is redirected Home.
          */}
          <Route
            path={ROUTES.temporaryExcavation}
            element={
              <RoleGuard capability="TEMPORARY_EXCAVATION">
                <TemporaryExcavationScreen />
              </RoleGuard>
            }
          />
          <Route
            path={ROUTES.newExcavationApplication}
            element={
              <RoleGuard capability="TEMPORARY_EXCAVATION">
                <NewApplicationScreen />
              </RoleGuard>
            }
          />
          <Route
            path={ROUTES.excavationApplication()}
            element={
              <RoleGuard capability="TEMPORARY_EXCAVATION">
                <ApplicationDetailsScreen />
              </RoleGuard>
            }
          />
          {/*
            Payment is part of the organization-only workflow and carries the
            same guard. A consumer has no application to pay for.
          */}
          <Route
            path={ROUTES.applicationPayment()}
            element={
              <RoleGuard capability="TEMPORARY_EXCAVATION">
                <PaymentScreen />
              </RoleGuard>
            }
          />

          <Route path={ROUTES.more} element={<MoreScreen />} />

          <Route path="*" element={<NotFoundScreen />} />
        </Route>
      </Route>
    </Routes>
  );
}
