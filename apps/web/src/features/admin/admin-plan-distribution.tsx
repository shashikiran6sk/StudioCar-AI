import { Card } from "@studiocar/ui";

import {
  ADMIN_PLAN_DISTRIBUTION_EMPTY_LABEL,
  ADMIN_PLAN_DISTRIBUTION_TITLE,
} from "../../server/admin/admin.constants";
import { formatDashboardCount } from "../dashboard/format-dashboard-count";

export interface AdminPlanDistributionRow {
  accountCount: number;
  planName: string;
}

export interface AdminPlanDistributionProps {
  plans: readonly AdminPlanDistributionRow[];
}

export function AdminPlanDistribution({ plans }: AdminPlanDistributionProps) {
  return (
    <Card className="admin-card">
      <header className="profile-section-card__header">
        <h2>{ADMIN_PLAN_DISTRIBUTION_TITLE}</h2>
      </header>
      {plans.length === 0 ? (
        <p>{ADMIN_PLAN_DISTRIBUTION_EMPTY_LABEL}</p>
      ) : (
        <ul className="admin-list">
          {plans.map((plan) => (
            <li className="admin-list__item" key={plan.planName}>
              <div>
                <strong>{plan.planName}</strong>
              </div>
              <div className="admin-list__actions">
                {formatDashboardCount(plan.accountCount)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
