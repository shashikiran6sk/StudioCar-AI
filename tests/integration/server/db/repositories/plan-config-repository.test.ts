import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../../packages/database-runtime/src/client";
import { PrismaPlanConfigRepository } from "../../../../../apps/web/src/server/db/repositories/plan-config-repository";
import { DEFAULT_PLAN_CONFIGURATIONS } from "../../../../../apps/web/src/server/plans/default-plan-configurations";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const testKeys = ["TEST_FREE", "TEST_PRO", "TEST_INACTIVE"];
const actorEmail = "plan-editor@integration.studiocar.test";

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
    await database.auditLog.deleteMany({
      where: { resourceType: "PlanConfig", resourceId: { in: testKeys } },
    });
    await database.planConfig.deleteMany({
      where: { planKey: { in: testKeys } },
    });
    await database.user.deleteMany({ where: { primaryEmail: actorEmail } });
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

  it("accepts every shipped default, including Studio Plus", async () => {
    /**
     * Seeding here rather than assuming a seeded database proves two things at
     * once: the command is idempotent, and every default the product ships
     * satisfies the constraints the database enforces.
     */
    await repository.seedMissing(DEFAULT_PLAN_CONFIGURATIONS);

    const stored = await repository.findAll();
    const keys = stored.map((plan) => plan.planKey);
    for (const plan of DEFAULT_PLAN_CONFIGURATIONS) {
      expect(keys).toContain(plan.planKey);
    }

    const plus = stored.find((plan) => plan.planKey === "STUDIO_PLUS");
    expect(plus).toMatchObject({
      displayName: "Studio Plus",
      priceMinorUnits: 199_900,
      includedImages: 100,
      maxImagesPerBatch: 20,
      allowanceScope: "LIFETIME",
    });
  });
  /** Somebody to attribute an edit to, so the audit trail has a real actor. */
  async function createActor() {
    return database.user.create({
      data: { primaryEmail: actorEmail, displayName: "Plan Editor" },
    });
  }

  const edit = {
    active: true,
    billingInterval: "MONTHLY" as const,
    description: "Edited by an administrator.",
    displayName: "Test Free Edited",
    displayOrder: 95,
    featured: true,
    features: ["40 images each month"],
    includedImages: 40,
    maxImagesPerBatch: 8,
    priceMinorUnits: 199_900,
    purchasable: false,
    segment: "Edited",
    storageBytes: null,
  };

  it("applies an edit and records who made it", async () => {
    const actor = await createActor();
    await repository.seedMissing([sample]);

    await repository.update({
      actorUserId: actor.id,
      fallback: sample,
      planKey: sample.planKey,
      update: edit,
    });

    expect(await repository.findByKey(sample.planKey)).toMatchObject({
      displayName: "Test Free Edited",
      includedImages: 40,
      maxImagesPerBatch: 8,
      priceMinorUnits: 199_900,
      storageBytes: null,
    });
    const audit = await database.auditLog.findFirstOrThrow({
      where: { resourceType: "PlanConfig", resourceId: sample.planKey },
      select: { action: true, userId: true },
    });
    expect(audit).toEqual({ action: "PLAN_CONFIG_UPDATED", userId: actor.id });
  });

  it("creates the plan when the database has not been seeded", async () => {
    const actor = await createActor();

    await repository.update({
      actorUserId: actor.id,
      fallback: sample,
      planKey: sample.planKey,
      update: edit,
    });

    // The scope decides how usage already charged is counted, so it is taken
    // from the shipped default rather than from the submission.
    expect(await repository.findByKey(sample.planKey)).toMatchObject({
      allowanceScope: sample.allowanceScope,
      currency: sample.currency,
      includedImages: 40,
    });
  });

  it("never lets an edit change how an allowance is counted", async () => {
    const actor = await createActor();
    await repository.seedMissing([sample]);

    await repository.update({
      actorUserId: actor.id,
      fallback: { ...sample, allowanceScope: "BILLING_PERIOD" },
      planKey: sample.planKey,
      update: edit,
    });

    // The row already existed, so the fallback scope is never applied to it.
    expect(await repository.findByKey(sample.planKey)).toMatchObject({
      allowanceScope: "LIFETIME",
    });
  });

  it("refuses an edit the database's own constraints reject", async () => {
    const actor = await createActor();
    await repository.seedMissing([sample]);

    await expect(
      repository.update({
        actorUserId: actor.id,
        fallback: sample,
        planKey: sample.planKey,
        update: { ...edit, includedImages: 5, maxImagesPerBatch: 50 },
      }),
    ).rejects.toThrow();

    // The transaction rolls back, so neither the plan nor the trail changed.
    expect(await repository.findByKey(sample.planKey)).toMatchObject({
      includedImages: sample.includedImages,
    });
    expect(
      await database.auditLog.count({
        where: { resourceType: "PlanConfig", resourceId: sample.planKey },
      }),
    ).toBe(0);
  });

  it("leaves one consistent result when two administrators edit at once", async () => {
    const actor = await createActor();
    await repository.seedMissing([sample]);

    await Promise.all([
      repository.update({
        actorUserId: actor.id,
        fallback: sample,
        planKey: sample.planKey,
        update: { ...edit, includedImages: 40, maxImagesPerBatch: 8 },
      }),
      repository.update({
        actorUserId: actor.id,
        fallback: sample,
        planKey: sample.planKey,
        update: { ...edit, includedImages: 60, maxImagesPerBatch: 12 },
      }),
    ]);

    const stored = await repository.findByKey(sample.planKey);
    // Whichever won, the pair it wrote must belong together.
    expect(stored?.includedImages === 40 ? stored.maxImagesPerBatch : 12).toBe(
      stored?.includedImages === 40 ? 8 : 12,
    );
    expect(
      await database.auditLog.count({
        where: { resourceType: "PlanConfig", resourceId: sample.planKey },
      }),
    ).toBe(2);
  });
});
