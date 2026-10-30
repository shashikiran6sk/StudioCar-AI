import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../packages/database-runtime/src/client";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const MIGRATION_STATEMENTS = readFileSync(
  path.resolve(
    __dirname,
    "../../../../apps/web/prisma/migrations/20261030120000_remove_storage_pack_features/migration.sql",
  ),
  "utf8",
)
  .split(/;\s*(?:\n|$)/)
  .map((statement) => statement.trim())
  .filter((statement) => statement.replace(/--.*$/gm, "").trim().length > 0);
const SEEDED_FREE_FEATURES = [
  "15 images in total",
  "Maximum 5 images per batch",
  "Standard background processing",
  "3 GB storage",
];
const SEEDED_PRO_FEATURES = [
  "500 images each month",
  "Priority batch processing",
  "Increased storage",
  "Team-ready inventory workflow",
];
const EDITED_PRO_FEATURES = ["An administrator's own wording", "Increased storage"];

/** Thrown to roll the transaction back once its assertions have run. */
class RollBack extends Error {}

/** What this migration writes; later migrations may rewrite it again. */
const MIGRATED_FREE_FEATURES = [
  "15 images in total",
  "Maximum 5 images per batch",
  "Standard background processing",
  "Originals always preserved",
];
const MIGRATED_PRO_FEATURES = [
  "500 images each month",
  "Priority batch processing",
  "High-resolution output",
  "Team-ready inventory workflow",
];

databaseDescribe("remove_storage_pack_features migration", () => {
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

  async function runScenario(
    proFeatures: readonly string[],
  ): Promise<{ free: readonly string[]; pro: readonly string[] }> {
    const observed: { free: readonly string[]; pro: readonly string[] }[] = [];
    /**
     * Plan rows are shared by every integration file, so each scenario runs
     * in one transaction that is rolled back rather than committed.
     */
    await expect(
      database.$transaction(async (transaction) => {
        await transaction.planConfig.deleteMany({
          where: { planKey: { in: ["FREE", "STUDIO_PRO"] } },
        });
        await transaction.planConfig.createMany({
          data: [
            planRow("FREE", SEEDED_FREE_FEATURES, 0),
            planRow("STUDIO_PRO", proFeatures, 2),
          ],
        });

        for (const statement of MIGRATION_STATEMENTS) {
          await transaction.$executeRawUnsafe(statement);
        }

        const rows = await transaction.planConfig.findMany({
          where: { planKey: { in: ["FREE", "STUDIO_PRO"] } },
          select: { features: true, planKey: true },
        });
        observed.push({
          free: rows.find((row) => row.planKey === "FREE")?.features ?? [],
          pro: rows.find((row) => row.planKey === "STUDIO_PRO")?.features ?? [],
        });
        throw new RollBack();
      }),
    ).rejects.toBeInstanceOf(RollBack);
    const [result] = observed;
    if (!result) throw new Error("The scenario did not record its plans.");
    return result;
  }

  it("replaces seeded storage lines", async () => {
    const { free, pro } = await runScenario(SEEDED_PRO_FEATURES);

    expect(free).toEqual(MIGRATED_FREE_FEATURES);
    expect(pro).toEqual(MIGRATED_PRO_FEATURES);
  });

  it("leaves a feature list an administrator has edited alone", async () => {
    const { free, pro } = await runScenario(EDITED_PRO_FEATURES);

    expect(free).toEqual(MIGRATED_FREE_FEATURES);
    expect(pro).toEqual(EDITED_PRO_FEATURES);
  });
});
