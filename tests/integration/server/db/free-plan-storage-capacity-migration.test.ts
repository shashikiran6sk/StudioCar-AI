import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../packages/database-runtime/src/client";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const MIGRATION_STATEMENTS = readFileSync(
  path.resolve(
    __dirname,
    "../../../../apps/web/prisma/migrations/20261030190000_free_plan_storage_capacity/migration.sql",
  ),
  "utf8",
)
  .split(/;\s*(?:\n|$)/)
  .map((statement) => statement.trim())
  .filter((statement) => statement.replace(/--.*$/gm, "").trim().length > 0);
const SEEDED_FREE_STORAGE_BYTES = 3_221_225_472n;
const CHOSEN_STORAGE_BYTES = 10_737_418_240n;

/** Thrown to roll the transaction back once its assertions have run. */
class RollBack extends Error {}

databaseDescribe("free_plan_storage_capacity migration", () => {
  let database: ReturnType<typeof createDatabaseClient>;

  beforeAll(() => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required for integration tests.");
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  async function migrate(storageBytes: bigint): Promise<bigint | null> {
    const observed: (bigint | null)[] = [];
    /**
     * Plan rows are shared by every integration file, so each scenario runs
     * in one transaction that is rolled back rather than committed.
     */
    await expect(
      database.$transaction(async (transaction) => {
        await transaction.planConfig.deleteMany({ where: { planKey: "FREE" } });
        await transaction.planConfig.create({
          data: {
            active: true,
            allowanceScope: "LIFETIME",
            billingInterval: "NONE",
            currency: "INR",
            description: "Free description.",
            displayName: "Free",
            displayOrder: 0,
            features: [],
            includedImages: 15,
            maxImagesPerBatch: 5,
            planKey: "FREE",
            priceMinorUnits: 0,
            segment: "Explore",
            storageBytes,
          },
        });

        for (const statement of MIGRATION_STATEMENTS) {
          await transaction.$executeRawUnsafe(statement);
        }

        const row = await transaction.planConfig.findUnique({
          where: { planKey: "FREE" },
          select: { storageBytes: true },
        });
        observed.push(row?.storageBytes ?? null);
        throw new RollBack();
      }),
    ).rejects.toBeInstanceOf(RollBack);
    const [result] = observed;
    if (result === undefined) throw new Error("The scenario did not record the plan.");
    return result;
  }

  it("clears the seeded 3 GiB capacity", async () => {
    await expect(migrate(SEEDED_FREE_STORAGE_BYTES)).resolves.toBeNull();
  });

  it("keeps a capacity an administrator chose", async () => {
    await expect(migrate(CHOSEN_STORAGE_BYTES)).resolves.toBe(CHOSEN_STORAGE_BYTES);
  });
});
