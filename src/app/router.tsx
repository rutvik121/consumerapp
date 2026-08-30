import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AppShell, RequireSession, RoleGuard, ROUTES } from '@/navigation';
import {
  HomeScreen,
  MineralScreen,
  MoreScreen,
  NotFoundScreen,
  OrdersScreen,
  ProjectsScreen,
  TemporaryExcavationScreen,
} from '@/screens';
import { PersonaPickerScreen } from '@/prototype/PersonaPickerScreen';

/**
 * THE ROUTE TABLE.
 *
 * Three layers, outermost first:
 *
 *   AppShell         device frame, role-driven navigation, overlay root
 *   RequireSession   no session → entry point
 *   RoleGuard        no capability → redirected home
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
        {/* PROTOTYPE ONLY — replaced by Splash → Login → OTP in Increment 1. */}
        <Route path={ROUTES.personaPicker} element={<PersonaPickerScreen />} />

        <Route
          element={
            <RequireSession>
              <Outlet />
            </RequireSession>
          }
        >
          <Route index element={<Navigate to={ROUTES.home} replace />} />

          {/* Shared route, role-resolved content. One path, two experiences. */}
          <Route path={ROUTES.home} element={<HomeScreen />} />

          {/* ORGANIZATION ONLY — the hierarchy consumers do not have. */}
          <Route
            path={ROUTES.projects}
            element={
              <RoleGuard capability="VIEW_PROJECTS">
                <ProjectsScreen />
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

          {/* Shared operational flow. */}
          <Route path={ROUTES.orders} element={<OrdersScreen />} />

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
