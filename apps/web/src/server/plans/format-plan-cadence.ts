import type { PlanBillingInterval } from "@studiocar/contracts";

import { PLAN_CADENCE_LABELS } from "./plans.constants";

/** The words that sit beside a price: `forever`, `one-time`, or `/ month`. */
export function formatPlanCadence(interval: PlanBillingInterval): string {
  return PLAN_CADENCE_LABELS[interval];
}
