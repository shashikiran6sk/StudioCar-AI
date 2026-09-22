import type { PlanCatalogEntry, PlanKey } from "@studiocar/contracts";

import {
  DEFAULT_PLAN_CATALOG,
  FALLBACK_PLAN_ENTRY,
} from "./default-plan-catalog";
import { FALLBACK_PLAN_KEY } from "./plans.constants";

export interface ResolvedPlan {
  /** The key the account is actually treated as being on. */
  key: PlanKey;
  plan: PlanCatalogEntry;
}

/**
 * Finds the plan a subscription names, and never fails to return one.
 *
 * A plan an administrator has deactivated must not lock an account out of the
 * product, so the search widens from the live catalog to the shipped defaults
 * and finally to the free plan. Falling back to the smallest allowance is the
 * safe direction: it can delay work, never over-grant it.
 */
export function resolvePlanEntry(
  catalog: readonly PlanCatalogEntry[],
  planKey: PlanKey,
): ResolvedPlan {
  const configured =
    catalog.find((plan) => plan.planKey === planKey) ??
    DEFAULT_PLAN_CATALOG.find((plan) => plan.planKey === planKey);
  if (configured) return { key: planKey, plan: configured };

  return {
    key: FALLBACK_PLAN_KEY,
    plan:
      catalog.find((plan) => plan.planKey === FALLBACK_PLAN_KEY) ??
      FALLBACK_PLAN_ENTRY,
  };
}
