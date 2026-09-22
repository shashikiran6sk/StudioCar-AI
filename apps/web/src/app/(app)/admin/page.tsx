import { AdminActivityList } from "../../../features/admin/admin-activity-list";
import { AdminOverviewStats } from "../../../features/admin/admin-overview-stats";
import { AdminPlanDistribution } from "../../../features/admin/admin-plan-distribution";
import {
  ADMIN_OVERVIEW_DESCRIPTION,
  ADMIN_OVERVIEW_EYEBROW,
  ADMIN_OVERVIEW_TITLE,
} from "../../../server/admin/admin.constants";
import { getAdminActivity } from "../../../server/admin/get-admin-activity";
import {
  getAdminOverview,
  getAdminPlanDistribution,
} from "../../../server/admin/get-admin-overview";
import { requireAdministrator } from "../../../server/admin/require-administrator";
import { getPlanCatalog } from "../../../server/plans/get-plan-catalog";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdministrator();
  const [overview, distribution, catalog, activity] = await Promise.all([
    getAdminOverview(),
    getAdminPlanDistribution(),
    getPlanCatalog(),
    getAdminActivity(),
  ]);

  return (
    <>
      <header className="app-page-header">
        <div>
          <p className="eyebrow">{ADMIN_OVERVIEW_EYEBROW}</p>
          <h1>{ADMIN_OVERVIEW_TITLE}</h1>
          <p>{ADMIN_OVERVIEW_DESCRIPTION}</p>
        </div>
      </header>
      <AdminOverviewStats overview={overview} />
      <AdminPlanDistribution
        plans={distribution.map((plan) => ({
          accountCount: plan.accountCount,
          planName:
            catalog.find((entry) => entry.planKey === plan.planKey)
              ?.displayName ?? plan.planKey,
        }))}
      />
      <AdminActivityList entries={activity} />
    </>
  );
}
