import type { PrismaClient } from "@studiocar/database-runtime";
import {
  ImageAssetStatus,
  SubscriptionStatus,
  UsageEventType,
} from "@studiocar/database-runtime";

export interface UsageBillingRepositoryRecord {
  imageUsage: number;
  planKey: string | null;
  storageUsedBytes: bigint;
  uploadSessionUsage: number;
}

export class PrismaUsageBillingRepository {
  public constructor(private readonly database: PrismaClient) {}

  /**
   * The active subscription's plan, or null when the tenant is on the default
   * plan. Resolved separately because the plan decides how its own allowance
   * is counted.
   */
  public async findOwnedPlanKey(
    userId: string,
    now: Date,
  ): Promise<string | null> {
    const subscription = await this.database.planSubscription.findFirst({
      where: {
        currentPeriodEnd: { gt: now },
        status: {
          in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
        },
        userId,
      },
      orderBy: [{ currentPeriodEnd: "desc" }, { id: "desc" }],
      select: { planKey: true },
    });
    return subscription?.planKey ?? null;
  }

  /**
   * A lifetime allowance counts every charged image the tenant has ever had,
   * so it deliberately ignores the billing period. A billing-period allowance
   * refills monthly and is scoped to the current one.
   */
  public async getOwnedSummary(
    userId: string,
    billingPeriodKey: string | null,
    now: Date,
  ): Promise<UsageBillingRepositoryRecord> {
    const period =
      billingPeriodKey === null ? {} : { billingPeriodKey };

    const [images, sessions, originals, processed, subscription] =
      await Promise.all([
        this.database.usageEvent.aggregate({
          where: {
            ...period,
            type: UsageEventType.BACKGROUND_REMOVAL_COMPLETED,
            userId,
          },
          _sum: { quantity: true },
        }),
        this.database.usageEvent.aggregate({
          where: {
            ...period,
            type: UsageEventType.VEHICLE_PROCESSING_BATCH_CREATED,
            userId,
          },
          _sum: { quantity: true },
        }),
        this.database.imageAsset.aggregate({
          where: { status: ImageAssetStatus.UPLOADED, userId },
          _sum: { sizeBytes: true },
        }),
        this.database.processedAsset.aggregate({
          where: { userId },
          _sum: { sizeBytes: true },
        }),
        this.database.planSubscription.findFirst({
          where: {
            currentPeriodEnd: { gt: now },
            status: {
              in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
            },
            userId,
          },
          orderBy: [{ currentPeriodEnd: "desc" }, { id: "desc" }],
          select: { planKey: true },
        }),
      ]);

    return {
      imageUsage: images._sum.quantity ?? 0,
      planKey: subscription?.planKey ?? null,
      storageUsedBytes:
        (originals._sum.sizeBytes ?? 0n) +
        (processed._sum.sizeBytes ?? 0n),
      uploadSessionUsage: sessions._sum.quantity ?? 0,
    };
  }
}
