import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../packages/database-runtime/src/client";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const RETIRED_OWNER_EMAIL = "retired-studio-plus@integration.studiocar.test";
const PACK_OWNER_EMAIL = "renamed-studio-pack@integration.studiocar.test";
const MIGRATION_STATEMENTS = readFileSync(
  path.resolve(
    __dirname,
    "../../../../apps/web/prisma/migrations/20260923220000_retire_studio_plus_rename_studio_pack/migration.sql",
  ),
  "utf8",
)
  .split(/;\s*(?:\n|$)/)
  .map((statement) => statement.trim())
  .filter((statement) => statement.replace(/--.*$/gm, "").trim().length > 0);
const PERIOD_START = new Date("2026-09-01T00:00:00.000Z");
const PERIOD_END = new Date("2026-12-01T00:00:00.000Z");

/** Thrown to roll the transaction back once its assertions have run. */
class RollBack extends Error {}

databaseDescribe("retire_studio_plus_rename_studio_pack migration", () => {
  let database: ReturnType<typeof createDatabaseClient>;

  beforeAll(() => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required for integration tests.");
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  function planRow(planKey: string, displayName: string, priceMinorUnits: number) {
    return {
      active: true,
      allowanceScope: "LIFETIME" as const,
      billingInterval: "ONE_TIME" as const,
      currency: "INR",
      description: `${displayName} description.`,
      displayName,
      displayOrder: 1,
      features: [],
      includedImages: 100,
      maxImagesPerBatch: 20,
      planKey,
      priceMinorUnits,
      segment: "Segment",
    };
  }

  it("retires the old Studio Plus and gives Studio Pack its name", async () => {
    /**
     * Plan rows are shared by every integration file, so the whole scenario
     * runs in one transaction that is rolled back rather than committed.
     */
    await expect(
      database.$transaction(async (transaction) => {
        await transaction.planConfig.deleteMany({
          where: { planKey: { in: ["STUDIO_PACK", "STUDIO_PLUS"] } },
        });
        await transaction.planConfig.createMany({
          data: [
            planRow("STUDIO_PACK", "Studio Pack", 149_900),
            { ...planRow("STUDIO_PLUS", "Studio Plus", 799_900), displayOrder: 3 },
          ],
        });
        const [retiredOwner, packOwner] = await Promise.all([
          transaction.user.create({ data: { primaryEmail: RETIRED_OWNER_EMAIL } }),
          transaction.user.create({ data: { primaryEmail: PACK_OWNER_EMAIL } }),
        ]);
        const subscription = (userId: string, planKey: string) => ({
          currentPeriodEnd: PERIOD_END,
          currentPeriodStart: PERIOD_START,
          planKey,
          source: "MANUAL_ADMIN" as const,
          status: "ACTIVE" as const,
          userId,
        });
        await transaction.planSubscription.createMany({
          data: [
            subscription(retiredOwner.id, "STUDIO_PLUS"),
            subscription(packOwner.id, "STUDIO_PACK"),
          ],
        });

        for (const statement of MIGRATION_STATEMENTS) {
          await transaction.$executeRawUnsafe(statement);
        }

        const plans = await transaction.planConfig.findMany({
          where: { planKey: { in: ["STUDIO_PACK", "STUDIO_PLUS"] } },
          select: { displayName: true, planKey: true, priceMinorUnits: true },
        });
        expect(plans).toEqual([
          { displayName: "Studio Plus", planKey: "STUDIO_PLUS", priceMinorUnits: 149_900 },
        ]);

        // The retired plan's subscriber returns to Free instead of inheriting
        // the renamed plan.
        await expect(
          transaction.planSubscription.findFirst({
            where: { userId: retiredOwner.id },
            select: { planKey: true, status: true },
          }),
        ).resolves.toEqual({ planKey: "RETIRED_STUDIO_PLUS", status: "EXPIRED" });
        await expect(
          transaction.planSubscription.findFirst({
            where: { userId: packOwner.id },
            select: { planKey: true, status: true },
          }),
        ).resolves.toEqual({ planKey: "STUDIO_PLUS", status: "ACTIVE" });

        throw new RollBack();
      }),
    ).rejects.toBeInstanceOf(RollBack);
  });

  it("keeps a display name an administrator already changed", async () => {
    await expect(
      database.$transaction(async (transaction) => {
        await transaction.planConfig.deleteMany({
          where: { planKey: { in: ["STUDIO_PACK", "STUDIO_PLUS"] } },
        });
        await transaction.planConfig.create({
          data: planRow("STUDIO_PACK", "Starter Credits", 149_900),
        });

        for (const statement of MIGRATION_STATEMENTS) {
          await transaction.$executeRawUnsafe(statement);
        }

        await expect(
          transaction.planConfig.findUnique({
            where: { planKey: "STUDIO_PLUS" },
            select: { displayName: true },
          }),
        ).resolves.toEqual({ displayName: "Starter Credits" });

        throw new RollBack();
      }),
    ).rejects.toBeInstanceOf(RollBack);
  });
});
