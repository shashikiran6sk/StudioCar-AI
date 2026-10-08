
import type { ProcessingAllowance } from "../db/repositories/processing-job-repository";
import { getUsageBillingService } from "../billing/usage-billing-runtime";

/**
 * Reads the limits from the tenant's resolved plan. A lifetime allowance is
 * scoped to no billing period at all, which is what makes a free trial
 * something that runs out rather than something that refills every month.
 */
export async function resolveProcessingAllowance(
  userId: string,
  now: Date,
): Promise<ProcessingAllowance> {
  const plan = await getUsageBillingService().getCurrentPlan(userId, now);

  return {
    imageCapacity: plan.imageCapacity,
    maxImagesPerBatch: plan.maxImagesPerBatch,
  };
}
