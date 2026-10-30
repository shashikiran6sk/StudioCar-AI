import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../packages/database-runtime/src/client";
import { DEFAULT_PLAN_CONFIGURATIONS } from "../../../../apps/web/src/server/plans/default-plan-configurations";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const MIGRATION_STATEMENTS = readFileSync(
  path.resolve(
    __dirname,
    "../../../../apps/web/prisma/migrations/20261030180000_plan_features_match_delivery/migration.sql",
  ),
  "utf8",
)
  .split(/;\s*(?:\n|$)/)
  .map((statement) => statement.trim())
  .filter((statement) => statement.replace(/--.*$/gm, "").trim().length > 0);
const PLAN_KEYS = ["FREE", "STUDIO_PLUS", "STUDIO_PRO"];

/** Each plan as the storage migration left it, and as originally seeded. */
const AFTER_STORAGE_MIGRATION = {
  FREE: [
    "15 images in total",
    "Maximum 5 images per batch",
    "Standard background processing",
    "Originals always preserved",
  ],
  STUDIO_PLUS: [
    "100 image credits",
    "Up to 20 images per batch",
    "Premium studio backgrounds",
    "Re-processing included",
  ],
  STUDIO_PRO: [
    "500 images each month",
    "Priority batch processing",
    "High-resolution output",
    "Team-ready inventory workflow",
  ],
};
const ORIGINAL_SEED = {
  ...AFTER_STORAGE_MIGRATION,
  FREE: [
    "15 images in total",
    "Maximum 5 images per batch",
    "Standard background processing",
    "3 GB storage",
  ],
  STUDIO_PRO: [
    "500 images each month",
    "Priority batch processing",
    "Increased storage",
    "Team-ready inventory workflow",
  ],
};
const EDITED_PLUS_FEATURES = ["An administrator's own wording"];

/** Thrown to roll the transaction back once its assertions have run. */
class RollBack extends Error {}

function defaultFeatures(planKey: string): readonly string[] {
  const found = DEFAULT_PLAN_CONFIGURATIONS.find(
    (configuration) => configuration.planKey === planKey,
  );
  if (!found) throw new Error(`Expected a ${planKey} default.`);
  return found.features;
}

databaseDescribe("plan_features_match_delivery migration", () => {
  let database: ReturnType<typeof createDatabaseClient>;

  beforeAll(() => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required for integration tests.");
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  function planRow(planKey: string, features: readonly string[], displayOrder: number) {
    return {
      active: true,
      allowanceScope: "LIFETIME" as const,
      billingInterval: "NONE" as const,
      currency: "INR",
      description: `${planKey} description.`,
      displayName: planKey,
      displayOrder,
      features: [...features],
      includedImages: 15,
      maxImagesPerBatch: 5,
      planKey,
      priceMinorUnits: 0,
      segment: "Segment",
    };
  }

  async function migrate(
    seeded: Record<string, readonly string[]>,
  ): Promise<Record<string, readonly string[]>> {
    const observed: Record<string, readonly string[]>[] = [];
    /**
     * Plan rows are shared by every integration file, so each scenario runs
     * in one transaction that is rolled back rather than committed.
     */
    await expect(
      database.$transaction(async (transaction) => {
        await transaction.planConfig.deleteMany({
          where: { planKey: { in: PLAN_KEYS } },
        });
        await transaction.planConfig.createMany({
          data: PLAN_KEYS.map((planKey, index) =>
            planRow(planKey, seeded[planKey] ?? [], index),
          ),
        });

        for (const statement of MIGRATION_STATEMENTS) {
          await transaction.$executeRawUnsafe(statement);
        }

        const rows = await transaction.planConfig.findMany({
          where: { planKey: { in: PLAN_KEYS } },
          select: { features: true, planKey: true },
        });
        observed.push(
          Object.fromEntries(rows.map((row) => [row.planKey, row.features])),
        );
        throw new RollBack();
      }),
    ).rejects.toBeInstanceOf(RollBack);
    const [result] = observed;
    if (!result) throw new Error("The scenario did not record its plans.");
    return result;
  }

  it.each([
    ["after the storage migration", AFTER_STORAGE_MIGRATION],
    ["as originally seeded", ORIGINAL_SEED],
  ])("rewrites every plan %s to the shipped defaults", async (_label, seeded) => {
    const migrated = await migrate(seeded);

    for (const planKey of PLAN_KEYS) {
      expect(migrated[planKey]).toEqual(defaultFeatures(planKey));
    }
  });

  it("leaves a feature list an administrator has edited alone", async () => {
    const migrated = await migrate({
      ...AFTER_STORAGE_MIGRATION,
      STUDIO_PLUS: EDITED_PLUS_FEATURES,
    });

    expect(migrated["STUDIO_PLUS"]).toEqual(EDITED_PLUS_FEATURES);
    expect(migrated["FREE"]).toEqual(defaultFeatures("FREE"));
  });
});
