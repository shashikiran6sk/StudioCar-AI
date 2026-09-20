import {
  PlanKeySchema,
  UsageBillingSummarySchema,
  type UsageBillingSummary,
} from "@studiocar/contracts";
import { createUsageBillingPeriodKey } from "@studiocar/processing";

import type { UsageBillingRepositoryPort } from "./billing.types";
import { safeBigIntToNumber } from "../dashboard/safe-bigint-to-number";
import { findPricingPlan } from "../../features/pricing/find-pricing-plan";

export class UsageBillingService {
  public constructor(private readonly repository: UsageBillingRepositoryPort) {}

  public async getSummary(
    userId: string,
    now = new Date(),
  ): Promise<UsageBillingSummary> {
    const record = await this.repository.getOwnedSummary(
      userId,
      createUsageBillingPeriodKey(now),
      now,
    );
    const parsedPlanKey = PlanKeySchema.safeParse(record.planKey);
    const plan = findPricingPlan(
      parsedPlanKey.success ? parsedPlanKey.data : "FREE",
    );

    return UsageBillingSummarySchema.parse({
      currentPlan: {
        description: plan.description,
        imageCapacity: plan.imageCapacity,
        key: plan.key,
        name: plan.name,
        storageCapacityBytes: plan.storageCapacityBytes,
        uploadSessionCapacity: plan.uploadSessionCapacity,
      },
      imagesRemaining: Math.max(0, plan.imageCapacity - record.imageUsage),
      imagesUsed: record.imageUsage,
      storageUsedBytes: safeBigIntToNumber(record.storageUsedBytes),
      uploadSessionsRemaining:
        plan.uploadSessionCapacity === null
          ? null
          : Math.max(
              0,
              plan.uploadSessionCapacity - record.uploadSessionUsage,
            ),
      uploadSessionsUsed: record.uploadSessionUsage,
    });
  }
}
