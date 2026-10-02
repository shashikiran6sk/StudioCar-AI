import { UsageBillingSummarySchema, type UsageBillingSummary } from "@studiocar/contracts";
import { cache } from "react";

import { getUsageBillingService } from "./usage-billing-runtime";
import { getBillingRuntime } from "./billing-runtime";
import { getBillingStatus } from "./get-billing-status";
import { getPlanCatalog } from "../plans/get-plan-catalog";

/**
 * Memoised for the request so the sidebar summary and the billing page, which
 * report the same numbers, resolve them once rather than running the usage
 * aggregates twice on every visit to Packs & Billing.
 */
export const getUsageBillingSummary = cache(
  async (userId: string): Promise<UsageBillingSummary> => {
    const [base, paid, plans] = await Promise.all([
      getUsageBillingService().getSummary(userId),
      getBillingStatus(getBillingRuntime().database, userId),
      getPlanCatalog(),
    ]);
    const activeSubscription = paid.subscription?.status === "ACTIVE" && paid.subscription.allowance > 0 ? paid.subscription : null;
    const paidKey = activeSubscription ? "STUDIO_PRO" : paid.purchasedCreditsGranted > 0 ? "STUDIO_PLUS" : null;
    if (!paidKey) return base;
    const plan = plans.find((entry) => entry.planKey === paidKey);
    if (!plan) return base;
    const capacity = activeSubscription
      ? activeSubscription.allowance
      : Math.max(plan.includedImages, paid.purchasedCreditsGranted);
    const remaining = activeSubscription ? activeSubscription.remaining : paid.purchasedCredits;
    const used = activeSubscription ? activeSubscription.consumed : Math.max(0, capacity - remaining);
    return UsageBillingSummarySchema.parse({
      ...base,
      currentPlan: {
        allowanceScope: plan.allowanceScope,
        description: plan.description,
        imageCapacity: capacity,
        key: paidKey,
        maxImagesPerBatch: plan.maxImagesPerBatch,
        name: plan.displayName,
        storageCapacityBytes: plan.storageBytes,
        uploadSessionCapacity: null,
      },
      imagesRemaining: remaining,
      imagesUsed: used,
    });
  },
);
