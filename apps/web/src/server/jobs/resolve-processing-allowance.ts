import { createUsageBillingPeriodKey } from "@studiocar/processing";

import type { ProcessingAllowance } from "../db/repositories/processing-job-repository";
import { getUsageBillingSummary } from "../billing/get-usage-billing-summary";

/**
 * Reads the limits from the tenant's resolved plan. A lifetime allowance is
 * scoped to no billing period at all, which is what makes a free trial
 * something that runs out rather than something that refills every month.
 */
export async function resolveProcessingAllowance(
  userId: string,
  now: Date,
): Promise<ProcessingAllowance> {
  const summary = await getUsageBillingSummary(userId);

  return {
    imageCapacity: summary.currentPlan.imageCapacity,
    maxImagesPerBatch: summary.currentPlan.maxImagesPerBatch,
    allowanceBillingPeriodKey:
      summary.currentPlan.allowanceScope === "LIFETIME"
        ? null
        : createUsageBillingPeriodKey(now),
  };
}
