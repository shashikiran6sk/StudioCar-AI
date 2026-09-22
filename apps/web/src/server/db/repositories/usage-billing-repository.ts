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

  public async getOwnedSummary(
    userId: string,
    billingPeriodKey: string,
    now: Date,
  ): Promise<UsageBillingRepositoryRecord> {
    const [images, sessions, originals, processed, subscription] =
      await Promise.all([
        this.database.usageEvent.aggregate({
          where: {
            billingPeriodKey,
            type: UsageEventType.BACKGROUND_REMOVAL_COMPLETED,
            userId,
          },
          _sum: { quantity: true },
        }),
        this.database.usageEvent.aggregate({
          where: {
            billingPeriodKey,
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
