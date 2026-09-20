import type { UsageBillingSummary } from "@studiocar/contracts";

import { UsageCurrentPlanCard } from "./usage-current-plan-card";
import { UsageQuotaCard } from "./usage-quota-card";
import {
  USAGE_BILLING_STORAGE_LABEL,
  USAGE_BILLING_UPLOAD_SESSIONS_LABEL,
} from "./usage-billing.constants";
import { formatDashboardCount } from "../dashboard/format-dashboard-count";
import { formatStorageSize } from "../dashboard/format-storage-size";

const UNBOUNDED_CAPACITY_LABEL = "No configured limit";
const MINIMUM_PROGRESS_CAPACITY = 1;

export interface UsageOverviewProps {
  summary: UsageBillingSummary;
}

export function UsageOverview({ summary }: UsageOverviewProps) {
  const sessionCapacity = summary.currentPlan.uploadSessionCapacity;
  const storageCapacity = summary.currentPlan.storageCapacityBytes;

  return (
    <section aria-label="Current plan usage" className="usage-overview">
      <UsageCurrentPlanCard summary={summary} />
      <div className="usage-overview__quotas">
        <UsageQuotaCard
          capacity={
            sessionCapacity ??
            Math.max(MINIMUM_PROGRESS_CAPACITY, summary.uploadSessionsUsed)
          }
          label={
            sessionCapacity === null
              ? `${USAGE_BILLING_UPLOAD_SESSIONS_LABEL} · ${UNBOUNDED_CAPACITY_LABEL}`
              : USAGE_BILLING_UPLOAD_SESSIONS_LABEL
          }
          value={
            sessionCapacity === null
              ? formatDashboardCount(summary.uploadSessionsUsed)
              : `${formatDashboardCount(summary.uploadSessionsUsed)} / ${formatDashboardCount(sessionCapacity)}`
          }
          valueAmount={summary.uploadSessionsUsed}
        />
        <UsageQuotaCard
          capacity={
            storageCapacity ??
            Math.max(MINIMUM_PROGRESS_CAPACITY, summary.storageUsedBytes)
          }
          label={
            storageCapacity === null
              ? `${USAGE_BILLING_STORAGE_LABEL} · ${UNBOUNDED_CAPACITY_LABEL}`
              : `${USAGE_BILLING_STORAGE_LABEL} of ${formatStorageSize(storageCapacity)}`
          }
          value={formatStorageSize(summary.storageUsedBytes)}
          valueAmount={summary.storageUsedBytes}
        />
      </div>
    </section>
  );
}
