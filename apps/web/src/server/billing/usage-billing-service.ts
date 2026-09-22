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

  public async getSummary(
    userId: string,
    now = new Date(),
  ): Promise<UsageBillingSummary> {
    /**
     * The plan is resolved first because it decides how its own allowance is
     * counted: a lifetime allowance never refills, so it must not be scoped to
     * the current billing period.
     */
    const ownedPlanKey = await this.repository.findOwnedPlanKey(userId, now);
    const parsedPlanKey = PlanKeySchema.safeParse(ownedPlanKey);
    const { key, plan } = resolvePlanEntry(
      await this.planCatalog.list(),
      parsedPlanKey.success ? parsedPlanKey.data : FALLBACK_PLAN_KEY,
    );
    const record = await this.repository.getOwnedSummary(
      userId,
      plan.allowanceScope === "LIFETIME"
        ? null
        : createUsageBillingPeriodKey(now),
      now,
    );

    return UsageBillingSummarySchema.parse({
      currentPlan: {
        allowanceScope: plan.allowanceScope,
        description: plan.description,
        imageCapacity: plan.includedImages,
        key,
        maxImagesPerBatch: plan.maxImagesPerBatch,
        name: plan.displayName,
        storageCapacityBytes: plan.storageBytes,
        uploadSessionCapacity: null,
      },
      imagesRemaining: Math.max(0, plan.includedImages - record.imageUsage),
      imagesUsed: record.imageUsage,
      storageUsedBytes: safeBigIntToNumber(record.storageUsedBytes),
      uploadSessionsRemaining: null,
      uploadSessionsUsed: record.uploadSessionUsage,
    });
  }
}
