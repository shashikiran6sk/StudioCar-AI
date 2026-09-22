import { cache } from "react";

import { getUsageBillingSummary } from "../billing/get-usage-billing-summary";
import type { PlanUsageSummary } from "./plan-usage.types";
import { toPlanUsageSummary } from "./to-plan-usage-summary";

/**
 * Memoised for the duration of a request, so the sidebar and a page showing the
 * same numbers resolve them once. The memoisation is React's and therefore
 * applies only inside a request scope. A failure returns null rather than
 * throwing: the workspace must not become unreachable because a usage aggregate
 * was momentarily unavailable.
 */
export const getPlanUsageSummary = cache(
  async (userId: string): Promise<PlanUsageSummary | null> => {
    try {
      return toPlanUsageSummary(
        await getUsageBillingSummary(userId),
      );
    } catch {
      return null;
    }
  },
);
