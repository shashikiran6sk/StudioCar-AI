import type { DashboardSummary } from "@studiocar/contracts";

import { DashboardStatCard } from "./dashboard-stat-card";
import {
  DASHBOARD_IMAGE_ACTIVE_LABEL,
  DASHBOARD_IMAGES_ACTIVE_LABEL,
  DASHBOARD_IMAGES_LABEL,
  DASHBOARD_IMAGES_PROCESSED_LABEL,
  DASHBOARD_NO_TERMINAL_JOBS_LABEL,
  DASHBOARD_STORAGE_USED_LABEL,
  DASHBOARD_SUCCESSFUL_LABEL,
  DASHBOARD_THIS_MONTH_LABEL,
  DASHBOARD_USAGE_REMAINING_LABEL,
  DASHBOARD_VEHICLES_PROCESSED_LABEL,
  DASHBOARD_VEHICLES_PROCESSING_LABEL,
} from "./dashboard.constants";
import { formatDashboardCount } from "./format-dashboard-count";
import { formatStorageSize } from "./format-storage-size";

export interface DashboardStatsProps {
  summary: DashboardSummary;
}

export function DashboardStats({ summary }: DashboardStatsProps) {
  const activeImageLabel =
    summary.activeImageCount === 1
      ? DASHBOARD_IMAGE_ACTIVE_LABEL
      : DASHBOARD_IMAGES_ACTIVE_LABEL;
  const successLabel =
    summary.processingSuccessRate === null
      ? DASHBOARD_NO_TERMINAL_JOBS_LABEL
      : `${String(summary.processingSuccessRate)}% ${DASHBOARD_SUCCESSFUL_LABEL}`;

  return (
    <section aria-label="Workspace statistics" className="dashboard-stats">
      <DashboardStatCard
        label={DASHBOARD_VEHICLES_PROCESSED_LABEL}
        supportingText={`+${formatDashboardCount(summary.vehiclesProcessedThisPeriod)} ${DASHBOARD_THIS_MONTH_LABEL}`}
        value={formatDashboardCount(summary.vehiclesProcessed)}
      />
      <DashboardStatCard
        label={DASHBOARD_IMAGES_PROCESSED_LABEL}
        supportingText={successLabel}
        value={formatDashboardCount(summary.imagesProcessed)}
      />
      <DashboardStatCard
        label={DASHBOARD_VEHICLES_PROCESSING_LABEL}
        supportingText={`${formatDashboardCount(summary.activeImageCount)} ${activeImageLabel}`}
        value={formatDashboardCount(summary.vehiclesProcessing)}
      />
      <DashboardStatCard
        inverted
        label={DASHBOARD_USAGE_REMAINING_LABEL}
        supportingText={`${DASHBOARD_IMAGES_LABEL} · ${summary.planName} plan`}
        value={formatDashboardCount(summary.imagesRemaining)}
      />
      <DashboardStatCard
        label={DASHBOARD_STORAGE_USED_LABEL}
        supportingText={`of ${formatStorageSize(summary.storageCapacityBytes)}`}
        value={formatStorageSize(summary.storageUsedBytes)}
      />
    </section>
  );
}
