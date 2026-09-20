import {
  DashboardSummarySchema,
  type DashboardSummary,
} from "@studiocar/contracts";
import { createUsageBillingPeriodKey } from "@studiocar/processing";

import { calculateProcessingSuccessRate } from "./calculate-processing-success-rate";
import { DASHBOARD_RECENT_VEHICLE_LIMIT } from "./dashboard.constants";
import { dashboardPeriodStart } from "./dashboard-period-start";
import type { DashboardRepositoryPort } from "./dashboard.types";
import { safeBigIntToNumber } from "./safe-bigint-to-number";
import type { InventoryApplication } from "../inventory/inventory.types";
import { findPricingPlan } from "../../features/pricing/find-pricing-plan";

export class DashboardService {
  public constructor(
    private readonly repository: DashboardRepositoryPort,
    private readonly inventory: InventoryApplication,
  ) {}

  public async getSummary(
    userId: string,
    now = new Date(),
  ): Promise<DashboardSummary> {
    const billingPeriodKey = createUsageBillingPeriodKey(now);
    const freePlan = findPricingPlan("FREE");
    const [metrics, recent] = await Promise.all([
      this.repository.getOwnedMetrics(
        userId,
        billingPeriodKey,
        dashboardPeriodStart(now),
      ),
      this.inventory.list(userId, {
        filter: "ALL",
        limit: DASHBOARD_RECENT_VEHICLE_LIMIT,
        sort: "CREATED_DESC",
        view: "GRID",
      }),
    ]);

    return DashboardSummarySchema.parse({
      activeImageCount: metrics.activeImageCount,
      imagesProcessed: metrics.imagesProcessed,
      imagesProcessedThisPeriod: metrics.imagesProcessedThisPeriod,
      imagesRemaining: Math.max(
        0,
        freePlan.imageCapacity - metrics.imagesProcessedThisPeriod,
      ),
      planName: freePlan.name,
      processingSuccessRate: calculateProcessingSuccessRate(
        metrics.completedJobCount,
        metrics.unsuccessfulJobCount,
      ),
      recentVehicles: recent.items,
      storageCapacityBytes: freePlan.storageCapacityBytes ?? 0,
      storageUsedBytes: safeBigIntToNumber(metrics.storageUsedBytes),
      vehiclesProcessed: metrics.vehiclesProcessed,
      vehiclesProcessedThisPeriod: metrics.vehiclesProcessedThisPeriod,
      vehiclesProcessing: metrics.vehiclesProcessing,
    });
  }
}
