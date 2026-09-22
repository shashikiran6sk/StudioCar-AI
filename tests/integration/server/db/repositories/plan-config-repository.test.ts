import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../../packages/database-runtime/src/client";
import { PrismaPlanConfigRepository } from "../../../../../apps/web/src/server/db/repositories/plan-config-repository";
import { DEFAULT_PLAN_CONFIGURATIONS } from "../../../../../apps/web/src/server/plans/default-plan-configurations";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const testKeys = ["TEST_FREE", "TEST_PRO", "TEST_INACTIVE"];

const sample = {
  planKey: "TEST_FREE",
  displayName: "Test Free",
  description: "A plan used only by integration tests.",
  segment: "Explore",
  active: true,
  purchasable: false,
  featured: false,
  priceMinorUnits: 0,
  currency: "INR",
  billingInterval: "NONE" as const,
  allowanceScope: "LIFETIME" as const,
  includedImages: 15,
  maxImagesPerBatch: 5,
  storageBytes: 3_221_225_472,
  features: ["15 images in total"],
  displayOrder: 90,
};

databaseDescribe("PrismaPlanConfigRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let repository: PrismaPlanConfigRepository;

  beforeAll(() => {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for integration tests.");
    }
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    repository = new PrismaPlanConfigRepository(database);
  });

  afterEach(async () => {
    await database.planConfig.deleteMany({
      where: { planKey: { in: testKeys } },
    });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("installs a missing plan and leaves an existing one untouched", async () => {
    expect(await repository.seedMissing([sample])).toBe(1);

    await database.planConfig.update({
      where: { planKey: sample.planKey },
      data: { includedImages: 99 },
    });

    // A plan an administrator has edited belongs to them, not the deployment.
    expect(await repository.seedMissing([sample])).toBe(0);
    const after = await repository.findByKey(sample.planKey);
    expect(after?.includedImages).toBe(99);
  });

  it("returns only active plans in display order", async () => {
    await repository.seedMissing([
      { ...sample, planKey: "TEST_PRO", displayOrder: 92 },
      { ...sample, planKey: "TEST_INACTIVE", displayOrder: 91, active: false },
    ]);

    const active = await repository.findActive();
    const keys = active.map((plan) => plan.planKey);
    expect(keys).toContain("TEST_PRO");
    expect(keys).not.toContain("TEST_INACTIVE");
    const orders = active.map((plan) => plan.displayOrder);
    expect([...orders]).toEqual([...orders].sort((a, b) => a - b));
  });

  it("refuses a negative price", async () => {
    await expect(
      repository.seedMissing([{ ...sample, priceMinorUnits: -1 }]),
    ).rejects.toThrow();
  });

  it("refuses a batch limit larger than the whole allowance", async () => {
    await expect(
      repository.seedMissing([
        { ...sample, includedImages: 5, maxImagesPerBatch: 10 },
      ]),
    ).rejects.toThrow();
  });

  it("refuses a zero batch limit", async () => {
    await expect(
      repository.seedMissing([{ ...sample, maxImagesPerBatch: 0 }]),
    ).rejects.toThrow();
  });

  it("holds every shipped default, including Studio Plus", async () => {
    const stored = await repository.findAll();
    const keys = stored.map((plan) => plan.planKey);
    for (const plan of DEFAULT_PLAN_CONFIGURATIONS) {
      expect(keys).toContain(plan.planKey);
    }

    const plus = stored.find((plan) => plan.planKey === "STUDIO_PLUS");
    expect(plus).toMatchObject({
      priceMinorUnits: 799_900,
      includedImages: 1_500,
      maxImagesPerBatch: 20,
      allowanceScope: "BILLING_PERIOD",
    });
  });
});
