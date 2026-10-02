import { PlanKeySchema } from "@studiocar/contracts";

import {
  FALLBACK_PROCESSING_QUALITY_TIER,
  PLAN_PROCESSING_QUALITY_TIERS,
} from "./processing-quality-tier.constants";
import type { ProcessingQualityTier } from "./processing-worker.types";

/**
 * The resolution a job is processed at, from the plan key of the account's
 * current subscription as stored in PostgreSQL. No subscription, an expired
 * one, and a key the catalog no longer knows (such as a retired plan) all
 * resolve to the free tier, matching how allowances resolve the same account.
 */
export function resolveProcessingQualityTier(
  subscriptionPlanKey: string | null,
): ProcessingQualityTier {
  const planKey = PlanKeySchema.safeParse(subscriptionPlanKey);
  return planKey.success
    ? PLAN_PROCESSING_QUALITY_TIERS[planKey.data]
    : FALLBACK_PROCESSING_QUALITY_TIER;
}
