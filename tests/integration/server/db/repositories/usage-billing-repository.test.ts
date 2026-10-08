import { UsageBillingService } from "../../../../../apps/web/src/server/billing/usage-billing-service";
import { DEFAULT_PLAN_CATALOG } from "../../../../../apps/web/src/server/plans/default-plan-catalog";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../../packages/database-runtime/src/client";
import { PrismaUsageBillingRepository } from "../../../../../apps/web/src/server/db/repositories/usage-billing-repository";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;

databaseDescribe("PrismaUsageBillingRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let repository: PrismaUsageBillingRepository;
  const ownerEmail = "usage-owner@integration.studiocar.test";
  const otherEmail = "usage-other@integration.studiocar.test";

  beforeAll(() => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required for integration tests.");
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    repository = new PrismaUsageBillingRepository(database);
  });

  afterEach(async () => {
    await database.creditLedger.deleteMany({ where: { user: { primaryEmail: { in: [ownerEmail, otherEmail] } } } });
    await database.user.deleteMany({ where: { primaryEmail: { in: [ownerEmail, otherEmail] } } });
  });

  afterAll(async () => database.$disconnect());

  it("resolves lifetime purchase history across calendar months", async () => {
    const owner = await database.user.create({ data: { primaryEmail: ownerEmail } });
    const service = new UsageBillingService(repository, { list: () => Promise.resolve(DEFAULT_PLAN_CATALOG) });
    expect((await service.getCurrentPlan(owner.id)).key).toBe("FREE");
    await database.creditLedger.create({ data: { userId: owner.id, amount: 100, type: "PURCHASE_GRANT", referenceId: owner.id, createdAt: new Date("2026-01-01") } });
    for (const now of [new Date("2026-02-01"), new Date("2030-01-01")]) expect((await service.getCurrentPlan(owner.id, now)).key).toBe("STUDIO_PLUS");
  });

  it("aggregates only owned immutable period usage, storage, and active plan", async () => {
    const [owner, other] = await Promise.all([
      database.user.create({ data: { primaryEmail: ownerEmail } }),
      database.user.create({ data: { primaryEmail: otherEmail } }),
    ]);
    const vehicle = await database.vehicle.create({ data: { name: "Owner vehicle", userId: owner.id } });
    await Promise.all([
      database.usageEvent.create({ data: { billingPeriodKey: "2026-09", idempotencyKey: "owner-images", quantity: 2, type: "BACKGROUND_REMOVAL_COMPLETED", userId: owner.id } }),
      database.usageEvent.create({ data: { billingPeriodKey: "2026-09", idempotencyKey: "owner-session", quantity: 1, type: "VEHICLE_PROCESSING_BATCH_CREATED", userId: owner.id } }),
      database.usageEvent.create({ data: { billingPeriodKey: "2026-09", idempotencyKey: "foreign-images", quantity: 9, type: "BACKGROUND_REMOVAL_COMPLETED", userId: other.id } }),
      database.imageAsset.create({ data: { mimeType: "image/jpeg", originalFilename: "source.jpg", originalObjectKey: `users/${owner.id}/source.jpg`, sizeBytes: 1_024, status: "UPLOADED", uploadExpiresAt: new Date("2027-01-01"), userId: owner.id, vehicleId: vehicle.id } }),
    ]);

    await expect(repository.getOwnedSummary(owner.id, "2026-09")).resolves.toEqual({ imageUsage: 2, planKey: null, storageUsedBytes: 1_024n, uploadSessionUsage: 1 });
  });
});
