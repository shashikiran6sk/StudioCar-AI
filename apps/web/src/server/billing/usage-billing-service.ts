import {
  PlanKeySchema,
  UsageBillingSummarySchema,
  type UsageBillingSummary,
} from "@studiocar/contracts";
import { createUsageBillingPeriodKey } from "@studiocar/processing";

import type {
  PlanCatalogPort,
  UsageBillingRepositoryPort,
} from "./billing.types";
import { safeBigIntToNumber } from "../dashboard/safe-bigint-to-number";
import { FALLBACK_PLAN_KEY } from "../plans/plans.constants";
import { resolvePlanEntry } from "../plans/resolve-plan-entry";

export class UsageBillingService {
  public constructor(
    private readonly repository: UsageBillingRepositoryPort,
    private readonly planCatalog: PlanCatalogPort,
  ) {}

  /** Resolve entitlements without reading usage or storage aggregates. */
  public async getCurrentPlan(
    userId: string,
    now = new Date(),
  ): Promise<UsageBillingSummary["currentPlan"]> {
    const [ownedPlanKey, catalog] = await Promise.all([
      this.repository.findOwnedPlanKey(userId, now),
      this.planCatalog.list(),
    ]);
    const parsedPlanKey = PlanKeySchema.safeParse(ownedPlanKey);
    const { key, plan } = resolvePlanEntry(
      catalog,
      parsedPlanKey.success ? parsedPlanKey.data : FALLBACK_PLAN_KEY,
    );
    return {
      allowanceScope: plan.allowanceScope,
      description: plan.description,
      imageCapacity: plan.includedImages,
      key,
      maxImagesPerBatch: plan.maxImagesPerBatch,
      name: plan.displayName,
      storageCapacityBytes: plan.storageBytes,
      uploadSessionCapacity: null,
    };
  }

  public async getSummary(
    userId: string,
    now = new Date(),
  ): Promise<UsageBillingSummary> {
    const currentPlan = await this.getCurrentPlan(userId, now);
    const record = await this.repository.getOwnedSummary(
      userId,
      currentPlan.allowanceScope === "LIFETIME"
        ? null
        : createUsageBillingPeriodKey(now),
      now,
    );

    return UsageBillingSummarySchema.parse({
      currentPlan,
      imagesRemaining: Math.max(0, currentPlan.imageCapacity - record.imageUsage),
      imagesUsed: record.imageUsage,
      storageUsedBytes: safeBigIntToNumber(record.storageUsedBytes),
      uploadSessionsRemaining: null,
      uploadSessionsUsed: record.uploadSessionUsage,
    });
  }
}
