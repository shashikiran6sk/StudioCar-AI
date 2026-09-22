import type { PlanCatalogEntry } from "@studiocar/contracts";

import {
  PLAN_FREE_ACTION_LABEL,
  PLAN_PAID_ACTION_PREFIX,
} from "./plans.constants";

/** The call to action on a plan card, derived rather than stored. */
export function describePlanAction(plan: PlanCatalogEntry): string {
  return plan.priceMinorUnits === 0
    ? PLAN_FREE_ACTION_LABEL
    : `${PLAN_PAID_ACTION_PREFIX} ${plan.displayName}`;
}
