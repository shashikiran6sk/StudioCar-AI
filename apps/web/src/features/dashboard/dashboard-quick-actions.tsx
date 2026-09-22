import type { DashboardSummary } from "@studiocar/contracts";
import { ButtonLink, StatusBadge } from "@studiocar/ui";

import { DashboardQuickActionCard } from "./dashboard-quick-action-card";
import {
  DASHBOARD_QUICK_ACTIONS,
  DASHBOARD_QUICK_ACTIONS_TITLE,
} from "./dashboard.constants";
import { formatDashboardCount } from "./format-dashboard-count";
import { VehicleCreateLauncher } from "../vehicle-create/vehicle-create-launcher";

const NEW_BATCH_LABEL = "New batch";
const READY_LABEL = "ready";
const PROCESSING_LABEL = "processing";
const OPEN_LABEL = "Open";

export interface DashboardQuickActionsProps {
  summary: DashboardSummary;
}

export function DashboardQuickActions({
  summary,
}: DashboardQuickActionsProps) {
  return (
    <section className="dashboard-section">
      <h2>{DASHBOARD_QUICK_ACTIONS_TITLE}</h2>
      <div className="dashboard-actions">
        <DashboardQuickActionCard
          action={<VehicleCreateLauncher />}
          description={DASHBOARD_QUICK_ACTIONS.upload.description}
          imageAlt={DASHBOARD_QUICK_ACTIONS.upload.imageAlt}
          imageLabel={DASHBOARD_QUICK_ACTIONS.upload.imageLabel}
          imagePath={DASHBOARD_QUICK_ACTIONS.upload.imagePath}
          status={<StatusBadge status="processing">{NEW_BATCH_LABEL}</StatusBadge>}
          title={DASHBOARD_QUICK_ACTIONS.upload.title}
        />
        <DashboardQuickActionCard
          action={
            <ButtonLink
              href={DASHBOARD_QUICK_ACTIONS.inventory.href}
              size="small"
              variant="ghost"
            >
              {OPEN_LABEL} →
            </ButtonLink>
          }
          description={DASHBOARD_QUICK_ACTIONS.inventory.description}
          imageAlt={DASHBOARD_QUICK_ACTIONS.inventory.imageAlt}
          imageLabel={DASHBOARD_QUICK_ACTIONS.inventory.imageLabel}
          imagePath={DASHBOARD_QUICK_ACTIONS.inventory.imagePath}
          status={
            <StatusBadge status="processing">
              {formatDashboardCount(summary.vehiclesProcessing)} {PROCESSING_LABEL}
            </StatusBadge>
          }
          title={DASHBOARD_QUICK_ACTIONS.inventory.title}
        />
        <DashboardQuickActionCard
          action={
            <ButtonLink
              href={DASHBOARD_QUICK_ACTIONS.results.href}
              size="small"
              variant="ghost"
            >
              {OPEN_LABEL} →
            </ButtonLink>
          }
          description={DASHBOARD_QUICK_ACTIONS.results.description}
          imageAlt={DASHBOARD_QUICK_ACTIONS.results.imageAlt}
          imageLabel={DASHBOARD_QUICK_ACTIONS.results.imageLabel}
          imagePath={DASHBOARD_QUICK_ACTIONS.results.imagePath}
          status={
            <StatusBadge status="completed">
              {formatDashboardCount(summary.vehiclesProcessed)} {READY_LABEL}
            </StatusBadge>
          }
          title={DASHBOARD_QUICK_ACTIONS.results.title}
        />
      </div>
    </section>
  );
}
