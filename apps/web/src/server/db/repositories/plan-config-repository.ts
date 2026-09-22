import type { PrismaClient } from "@studiocar/database-runtime";
import { Prisma } from "@studiocar/database-runtime";

import type { DefaultPlanConfiguration } from "../../plans/default-plan-configurations";

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
