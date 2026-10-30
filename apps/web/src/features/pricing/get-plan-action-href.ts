import type { PlanCatalogEntry } from "@studiocar/contracts";

import { BILLING_PACKS_PATH } from "../../app/app-routes";
import { createLoginHref } from "../auth/create-login-href";
import { MARKETING_START_PATH } from "../marketing/marketing.constants";

/**
 * Where a pricing card's call to action leads.
 *
 * The free plan starts in the workspace. A paid plan continues to the Billing
 * packs, because that is where the plan is chosen; sending it to the dashboard
 * would make the visitor find the pack a second time.
 */
export function getPlanActionHref(plan: PlanCatalogEntry): string {
  return plan.priceMinorUnits === 0
    ? MARKETING_START_PATH
    : createLoginHref(BILLING_PACKS_PATH);
}
