import { redirect } from "next/navigation";

import { LOGIN_PATH } from "../../app-routes";
import { DASHBOARD_DESCRIPTION } from "../../../features/dashboard/dashboard.constants";
import { dashboardDate } from "../../../features/dashboard/dashboard-date";
import { dashboardGreeting } from "../../../features/dashboard/dashboard-greeting";
import { DashboardQuickActions } from "../../../features/dashboard/dashboard-quick-actions";
import { DashboardRecentVehicles } from "../../../features/dashboard/dashboard-recent-vehicles";
import { DashboardStats } from "../../../features/dashboard/dashboard-stats";
import { userDisplayName } from "../../../features/shell/user-display-name";
import { VehicleCreateLauncher } from "../../../features/vehicle-create/vehicle-create-launcher";
import { getCurrentSession } from "../../../server/auth/get-current-session";
import { getDashboardService } from "../../../server/dashboard/dashboard-runtime";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session) redirect(LOGIN_PATH);

  const now = new Date();
  const name = userDisplayName(session.user).split(/\s+/, 1)[0];
  const summary = await getDashboardService().getSummary(session.userId, now);

  return (
    <div className="dashboard-page">
      <header className="app-page-header">
        <div>
          <p className="eyebrow">{dashboardDate(now)}</p>
          <h1>
            {dashboardGreeting(now)}, {name}.
          </h1>
          <p>{DASHBOARD_DESCRIPTION}</p>
        </div>
        <VehicleCreateLauncher />
      </header>
      <DashboardStats summary={summary} />
      <DashboardQuickActions summary={summary} />
      <DashboardRecentVehicles vehicles={summary.recentVehicles} />
    </div>
  );
}
