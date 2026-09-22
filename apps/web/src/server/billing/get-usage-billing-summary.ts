import type { UsageBillingSummary } from "@studiocar/contracts";
import { cache } from "react";

import { getUsageBillingService } from "./usage-billing-runtime";

/**
 * Memoised for the request so the sidebar summary and the billing page, which
 * report the same numbers, resolve them once rather than running the usage
 * aggregates twice on every visit to Packs & Billing.
 */
export const getUsageBillingSummary = cache(
  (userId: string): Promise<UsageBillingSummary> =>
    getUsageBillingService().getSummary(userId),
);
