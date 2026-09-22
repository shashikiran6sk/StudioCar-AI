import type { PlanConfigurationUpdate } from "@studiocar/contracts";
import type { PrismaClient } from "@studiocar/database-runtime";
import { Prisma } from "@studiocar/database-runtime";

import type { DefaultPlanConfiguration } from "../../plans/default-plan-configurations";
import {
  AUDIT_ACTION_PLAN_CONFIG_UPDATED,
  AUDIT_RESOURCE_PLAN_CONFIG,
  PLAN_CONFIG_LOCK_KEY,
} from "../../plans/plans.constants";

const planConfigSelect = {
  planKey: true,
  displayName: true,
  description: true,
  segment: true,
  active: true,
  purchasable: true,
  featured: true,
  priceMinorUnits: true,
  currency: true,
  billingInterval: true,
  allowanceScope: true,
  includedImages: true,
  maxImagesPerBatch: true,
  storageBytes: true,
  features: true,
  displayOrder: true,
  providerPriceId: true,
} satisfies Prisma.PlanConfigSelect;

export type PlanConfigRecord = Prisma.PlanConfigGetPayload<{
  select: typeof planConfigSelect;
}>;

export class PrismaPlanConfigRepository {
  public constructor(private readonly database: PrismaClient) {}

  public findActive(): Promise<PlanConfigRecord[]> {
    return this.database.planConfig.findMany({
      where: { active: true },
      orderBy: [{ displayOrder: "asc" }, { planKey: "asc" }],
      select: planConfigSelect,
    });
  }

  public findAll(): Promise<PlanConfigRecord[]> {
    return this.database.planConfig.findMany({
      orderBy: [{ displayOrder: "asc" }, { planKey: "asc" }],
      select: planConfigSelect,
    });
  }

  public findByKey(planKey: string): Promise<PlanConfigRecord | null> {
    return this.database.planConfig.findUnique({
      where: { planKey },
      select: planConfigSelect,
    });
  }

  /**
   * Applies an administrator's edit to one plan.
   *
   * It upserts rather than updates so the editor works on a database that has
   * not been seeded yet, taking `allowanceScope` and `currency` from the
   * shipped default. Neither is editable: the scope decides how usage already
   * charged is counted, and changing it would silently reinterpret it.
   *
   * The audit entry records who changed what, so a later dispute about an
   * allowance has an answer.
   */
  public async update(command: {
    actorUserId: string;
    fallback: DefaultPlanConfiguration;
    planKey: string;
    update: PlanConfigurationUpdate;
  }): Promise<void> {
    const editable = {
      active: command.update.active,
      description: command.update.description,
      displayName: command.update.displayName,
      displayOrder: command.update.displayOrder,
      featured: command.update.featured,
      features: [...command.update.features],
      includedImages: command.update.includedImages,
      maxImagesPerBatch: command.update.maxImagesPerBatch,
      billingInterval: command.update.billingInterval,
      priceMinorUnits: command.update.priceMinorUnits,
      purchasable: command.update.purchasable,
      segment: command.update.segment,
      storageBytes:
        command.update.storageBytes === null
          ? null
          : BigInt(command.update.storageBytes),
    } satisfies Prisma.PlanConfigUpdateInput;

    await this.database.$transaction(async (transaction) => {
      // Serialises two administrators editing the same plan at once.
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${PLAN_CONFIG_LOCK_KEY}, 0))`;

      await transaction.planConfig.upsert({
        where: { planKey: command.planKey },
        update: editable,
        create: {
          ...editable,
          planKey: command.planKey,
          allowanceScope: command.fallback.allowanceScope,
          currency: command.fallback.currency,
        },
      });
      await transaction.auditLog.create({
        data: {
          userId: command.actorUserId,
          action: AUDIT_ACTION_PLAN_CONFIG_UPDATED,
          resourceType: AUDIT_RESOURCE_PLAN_CONFIG,
          resourceId: command.planKey,
          metadata: {
            active: command.update.active,
            includedImages: command.update.includedImages,
            maxImagesPerBatch: command.update.maxImagesPerBatch,
            priceMinorUnits: command.update.priceMinorUnits,
          },
        },
      });
    });
  }

  /**
   * Installs the default catalog exactly once per plan. It never overwrites an
   * existing row: a plan an administrator has edited is theirs, not the
   * deployment's.
   */
  public async seedMissing(
    defaults: readonly DefaultPlanConfiguration[],
  ): Promise<number> {
    let created = 0;
    for (const plan of defaults) {
      const result = await this.database.planConfig.createMany({
        data: [
          {
            ...plan,
            features: [...plan.features],
            storageBytes: plan.storageBytes,
          },
        ],
        skipDuplicates: true,
      });
      created += result.count;
    }
    return created;
  }
}
