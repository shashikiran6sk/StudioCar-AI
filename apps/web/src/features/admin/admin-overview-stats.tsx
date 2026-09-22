import type { AdminOverview } from "../../server/admin/admin-overview.types";
import { DashboardStatCard } from "../dashboard/dashboard-stat-card";
import { formatDashboardCount } from "../dashboard/format-dashboard-count";
import { ADMIN_OVERVIEW_STATS } from "./admin.constants";

export interface AdminOverviewStatsProps {
  overview: AdminOverview;
}

export function AdminOverviewStats({ overview }: AdminOverviewStatsProps) {
  return (
    <section aria-label="Administration statistics" className="dashboard-stats">
      {ADMIN_OVERVIEW_STATS.map((stat) => (
        <DashboardStatCard
          key={stat.key}
          supportingText={stat.detail}
          label={stat.label}
          value={formatDashboardCount(overview[stat.key])}
        />
      ))}
    </section>
  );
}
