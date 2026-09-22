import type { DashboardSummary } from "@studiocar/contracts";
import type { DashboardRepositoryMetrics } from "../db/repositories/dashboard-repository";

export interface DashboardRepositoryPort {
  getOwnedMetrics(
    userId: string,
    billingPeriodKey: string,
    periodStart: Date,
  ): Promise<DashboardRepositoryMetrics>;
}

export interface DashboardApplication {
  getSummary(userId: string, now?: Date): Promise<DashboardSummary>;
}
