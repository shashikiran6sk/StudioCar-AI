import type { PlanKey } from "@studiocar/contracts";

import type { ProcessingQualityTier } from "./processing-worker.types";

/**
 * The output resolution each plan pays for. Keyed by every plan, so adding a
 * plan does not compile until someone decides its resolution: a new plan can
 * never silently receive paid-quality processing.
 */
export const PLAN_PROCESSING_QUALITY_TIERS = {
  FREE: "STANDARD",
  STUDIO_PLUS: "HIGH",
  STUDIO_PRO: "HIGH",
} as const satisfies Record<PlanKey, ProcessingQualityTier>;

/** What an account without a current, recognised paid plan receives. */
export const FALLBACK_PROCESSING_QUALITY_TIER: ProcessingQualityTier =
  PLAN_PROCESSING_QUALITY_TIERS.FREE;
