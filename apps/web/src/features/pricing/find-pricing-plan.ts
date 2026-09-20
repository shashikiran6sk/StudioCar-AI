import type { PlanKey } from "@studiocar/contracts";

import { PRICING_PLANS, type PricingPlan } from "./pricing-plans";

const MISSING_PLAN_CONFIGURATION_ERROR =
  "The requested pricing plan is not configured.";

export function findPricingPlan(key: PlanKey): PricingPlan {
  const plan = PRICING_PLANS.find((candidate) => candidate.key === key);
  if (!plan) throw new Error(MISSING_PLAN_CONFIGURATION_ERROR);
  return plan;
}
