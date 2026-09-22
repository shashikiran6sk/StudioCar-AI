import { Progress } from "@studiocar/ui";

import { formatStorageSize } from "../dashboard/format-storage-size";
import { formatDashboardCount } from "../dashboard/format-dashboard-count";
import type { PlanUsageSummary } from "../../server/plan-usage/plan-usage.types";
import {
  SIDEBAR_PLAN_FALLBACK_DESCRIPTION,
  SIDEBAR_PLAN_FALLBACK_HEADING,
  SIDEBAR_PLAN_IMAGES_USED_SUFFIX,
  SIDEBAR_PLAN_NAME_SUFFIX,
  SIDEBAR_PLAN_STORAGE_SEPARATOR,
  SIDEBAR_PLAN_USAGE_LABEL,
} from "./app-shell.constants";

export interface SidebarPlanSummaryProps {
  summary: PlanUsageSummary | null;
}

export function SidebarPlanSummary({ summary }: SidebarPlanSummaryProps) {
  if (!summary) {
    return (
      <div className="app-sidebar__plan">
        <strong>{SIDEBAR_PLAN_FALLBACK_HEADING}</strong>
        <span>{SIDEBAR_PLAN_FALLBACK_DESCRIPTION}</span>
      </div>
    );
  }

  const used = formatDashboardCount(summary.imagesUsed);
  const capacity = formatDashboardCount(summary.imageCapacity);

  return (
    <div className="app-sidebar__plan">
      <strong>{`${summary.planName} ${SIDEBAR_PLAN_NAME_SUFFIX}`}</strong>
      <Progress
        className="app-sidebar__plan-progress"
        label={`${used} / ${capacity} ${SIDEBAR_PLAN_IMAGES_USED_SUFFIX}`}
        max={summary.imageCapacity}
        value={Math.min(summary.imagesUsed, summary.imageCapacity)}
      />
      <span>
        {summary.storageCapacityBytes === null
          ? `${formatStorageSize(summary.storageUsedBytes)} ${SIDEBAR_PLAN_USAGE_LABEL}`
          : `${formatStorageSize(summary.storageUsedBytes)} ${SIDEBAR_PLAN_STORAGE_SEPARATOR} ${formatStorageSize(summary.storageCapacityBytes)}`}
      </span>
    </div>
  );
}
