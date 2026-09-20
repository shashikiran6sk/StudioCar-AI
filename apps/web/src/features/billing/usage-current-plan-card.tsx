import type { UsageBillingSummary } from "@studiocar/contracts";
import { Progress } from "@studiocar/ui";

import {
  USAGE_BILLING_CURRENT_PLAN_LABEL,
  USAGE_BILLING_IMAGES_USED_LABEL,
  USAGE_BILLING_REMAINING_LABEL,
} from "./usage-billing.constants";
import { formatDashboardCount } from "../dashboard/format-dashboard-count";

export interface UsageCurrentPlanCardProps {
  summary: UsageBillingSummary;
}

export function UsageCurrentPlanCard({
  summary,
}: UsageCurrentPlanCardProps) {
  return (
    <article className="usage-current-plan">
      <p>{USAGE_BILLING_CURRENT_PLAN_LABEL}</p>
      <h2>{summary.currentPlan.name}</h2>
      <span>{summary.currentPlan.description}</span>
      <Progress
        label={`${formatDashboardCount(summary.imagesUsed)} of ${formatDashboardCount(summary.currentPlan.imageCapacity)} ${USAGE_BILLING_IMAGES_USED_LABEL}`}
        max={summary.currentPlan.imageCapacity}
        value={summary.imagesUsed}
        valueLabel={`${formatDashboardCount(summary.imagesRemaining)} ${USAGE_BILLING_REMAINING_LABEL}`}
      />
    </article>
  );
}
