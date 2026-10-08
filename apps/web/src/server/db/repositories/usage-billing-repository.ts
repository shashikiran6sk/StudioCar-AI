import type { PrismaClient } from "@studiocar/database-runtime";
import {
  findOwnedPlanKey,
  ImageAssetStatus,
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
   * The lifetime purchase entitlement's plan, or null when the tenant is on the default
   * plan. Resolved separately because the plan decides how its own allowance
   * is counted.
   */
  public findOwnedPlanKey(userId: string): Promise<string | null> {
    return findOwnedPlanKey(this.database, userId);
  }

  /**
   * Free lifetime usage remains separate from purchased jobs. Optional period
   * filtering is reporting only; it never renews an allowance.
   */
  public async getOwnedSummary(
    userId: string,
    billingPeriodKey: string | null,
  ): Promise<UsageBillingRepositoryRecord> {
    const period =
      billingPeriodKey === null ? {} : { billingPeriodKey };

    const [images, sessions, originals, processed, ownedPlanKey] =
      await Promise.all([
        this.database.usageEvent.aggregate({
          where: {
            ...period,
            type: UsageEventType.BACKGROUND_REMOVAL_COMPLETED,
            OR: [{ jobId: null }, { job: { creditAllocation: null } }],
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
        findOwnedPlanKey(this.database, userId),
      ]);

    return {
      imageUsage: images._sum.quantity ?? 0,
      planKey: ownedPlanKey,
      storageUsedBytes:
        (originals._sum.sizeBytes ?? 0n) +
        (processed._sum.sizeBytes ?? 0n),
      uploadSessionUsage: sessions._sum.quantity ?? 0,
    };
  }
}
