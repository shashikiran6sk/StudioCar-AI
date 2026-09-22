import type { UsageBillingSummary } from "@studiocar/contracts";

import type { PlanUsageSummary } from "./plan-usage.types";

export function toPlanUsageSummary(
  summary: UsageBillingSummary,
): PlanUsageSummary {
  return {
    planKey: summary.currentPlan.key,
    planName: summary.currentPlan.name,
    imagesUsed: summary.imagesUsed,
    imageCapacity: summary.currentPlan.imageCapacity,
    storageUsedBytes: summary.storageUsedBytes,
    storageCapacityBytes: summary.currentPlan.storageCapacityBytes,
  };
}
