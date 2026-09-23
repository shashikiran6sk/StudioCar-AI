import type { DashboardSummary } from "@studiocar/contracts";
import { ButtonLink, StatusBadge } from "@studiocar/ui";

import { DashboardQuickActionCard } from "./dashboard-quick-action-card";
import {
  DASHBOARD_OPEN_LABEL,
  DASHBOARD_QUICK_ACTIONS,
  DASHBOARD_QUICK_ACTIONS_TITLE,
} from "./dashboard.constants";
import { describeAttentionQuickAction } from "./describe-attention-quick-action";
import { formatDashboardCount } from "./format-dashboard-count";
import { VehicleCreateLauncher } from "../vehicle-create/vehicle-create-launcher";

const NEW_BATCH_LABEL = "New batch";
const READY_LABEL = "ready";
const PROCESSING_LABEL = "processing";

export interface DashboardQuickActionsProps {
  summary: DashboardSummary;
}

export function DashboardQuickActions({
  summary,
}: DashboardQuickActionsProps) {
  const third = describeAttentionQuickAction(summary.attention);

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
              {DASHBOARD_OPEN_LABEL} →
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
            <ButtonLink href={third.href} size="small" variant="ghost">
              {third.cta} →
            </ButtonLink>
          }
          description={third.description}
          imageAlt={third.imageAlt}
          imageLabel={third.imageLabel}
          imagePath={third.imagePath}
          status={
            third.statusLabel ? (
              <StatusBadge status="failed">{third.statusLabel}</StatusBadge>
            ) : (
              <StatusBadge status="completed">
                {formatDashboardCount(summary.vehiclesProcessed)} {READY_LABEL}
              </StatusBadge>
            )
          }
          title={third.title}
        />
      </div>
    </section>
  );
}
