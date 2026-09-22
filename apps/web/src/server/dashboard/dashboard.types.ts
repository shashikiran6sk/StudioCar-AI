import type { DashboardSummary } from "@studiocar/contracts";
import type { DashboardRepositoryMetrics } from "../db/repositories/dashboard-repository";
import type { PlanUsageSummary } from "../plan-usage/plan-usage.types";

export interface DashboardRepositoryPort {
  getOwnedMetrics(
    userId: string,
    billingPeriodKey: string,
    periodStart: Date,
  ): Promise<DashboardRepositoryMetrics>;
}

/**
 * The dashboard reports allowance against the tenant's actual plan rather than
 * assuming the free one, so its numbers agree with the sidebar and billing.
 */
export interface PlanUsageResolverPort {
  resolve(userId: string, now: Date): Promise<PlanUsageSummary>;
}

export interface DashboardApplication {
  getSummary(userId: string, now?: Date): Promise<DashboardSummary>;
}
