import { PlanKeySchema } from "@studiocar/contracts";

import {
  FALLBACK_PROCESSING_QUALITY_TIER,
  PLAN_PROCESSING_QUALITY_TIERS,
} from "./processing-quality-tier.constants";
import type { ProcessingQualityTier } from "./processing-worker.types";

/**
 * The resolution a job is processed at, from the plan key of the account's
 * durable purchase history in PostgreSQL. An account without a purchase
 * and a key the catalog no longer knows (such as a retired plan) both
 * resolve to the free tier, matching how allowances resolve the same account.
 */
export function resolveProcessingQualityTier(
  ownedPlanKey: string | null,
): ProcessingQualityTier {
  const planKey = PlanKeySchema.safeParse(ownedPlanKey);
  return planKey.success
    ? PLAN_PROCESSING_QUALITY_TIERS[planKey.data]
    : FALLBACK_PROCESSING_QUALITY_TIER;
}
