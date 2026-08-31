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
  EnquiriesScreen,
  EnquiryDetailsScreen,
  HomeScreen,
  InventoryScreen,
  LoginScreen,
  MineralScreen,
  MoreScreen,
  NotFoundScreen,
  OrderDetailsScreen,
  OrdersScreen,
  OtpScreen,
  PackageDetailsScreen,
  ProjectDetailsScreen,
  ProjectsScreen,
  ReceiveScreen,
  RegisterScreen,
  SplashScreen,
  StockPointDetailsScreen,
  StockPointsScreen,
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
            path={ROUTES.projectDetails()}
            element={
              <RoleGuard capability="VIEW_PROJECTS">
                <ProjectDetailsScreen />
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

          {/* NORMAL CONSUMER ONLY — the flat equivalent of Projects. */}
          <Route
            path={ROUTES.mineral}
            element={
              <RoleGuard capability="VIEW_MINERAL_TAB">
                <MineralScreen />
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
          {/*
            Mineral acquisition, in the order the product context fixes:
            Find Stock Point → Stock Point Details → Mineral Enquiry.
            Raising an enquiry is only reachable FROM a stock point, which is
            why its path is nested under one.
          */}
          <Route path={ROUTES.stockPoints} element={<StockPointsScreen />} />
          <Route path={ROUTES.stockPointDetails()} element={<StockPointDetailsScreen />} />
          <Route path={ROUTES.createEnquiry()} element={<CreateEnquiryScreen />} />
          <Route path={ROUTES.enquiries} element={<EnquiriesScreen />} />
          <Route path={ROUTES.enquiryDetails()} element={<EnquiryDetailsScreen />} />
          <Route path={ROUTES.receive} element={<ReceiveScreen />} />
          <Route path={ROUTES.inventory} element={<InventoryScreen />} />

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

          <Route path={ROUTES.more} element={<MoreScreen />} />

          <Route path="*" element={<NotFoundScreen />} />
        </Route>
      </Route>
    </Routes>
  );
}
