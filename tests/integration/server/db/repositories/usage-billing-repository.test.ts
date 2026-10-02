import { SubscriptionSource, SubscriptionStatus } from "../../../../../packages/database-runtime/generated/prisma/client";
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
    await database.user.deleteMany({ where: { primaryEmail: { in: [ownerEmail, otherEmail] } } });
  });

  afterAll(async () => database.$disconnect());

  it.each([
    { planKey: "STUDIO_PLUS", status: SubscriptionStatus.ACTIVE, source: SubscriptionSource.MANUAL_ADMIN, end: "2026-10-01", expected: "STUDIO_PLUS" },
    { planKey: "STUDIO_PRO", status: SubscriptionStatus.ACTIVE, source: SubscriptionSource.PAYMENT_PROVIDER, end: "2026-10-01", expected: "STUDIO_PRO" },
    { planKey: "STUDIO_PRO", status: SubscriptionStatus.TRIALING, source: SubscriptionSource.PAYMENT_PROVIDER, end: "2026-10-01", expected: "STUDIO_PRO" },
    { planKey: "STUDIO_PLUS", status: SubscriptionStatus.CANCELLED, source: SubscriptionSource.MANUAL_ADMIN, end: "2026-10-01", expected: "FREE" },
    { planKey: "STUDIO_PRO", status: SubscriptionStatus.EXPIRED, source: SubscriptionSource.PAYMENT_PROVIDER, end: "2026-10-01", expected: "FREE" },
    { planKey: "STUDIO_PRO", status: SubscriptionStatus.ACTIVE, source: SubscriptionSource.PAYMENT_PROVIDER, end: "2026-09-20", expected: "FREE" },
    { planKey: "STUDIO_PRO", status: SubscriptionStatus.ACTIVE, source: SubscriptionSource.PAYMENT_PROVIDER, end: "2026-09-19", expected: "FREE" },
  ])("keeps focused entitlement and summary identical for $status / $source / $end", async ({ planKey, status, source, end, expected }) => {
    const owner = await database.user.create({ data: { primaryEmail: ownerEmail } });
    const now = new Date("2026-09-20");
    await database.planSubscription.create({ data: { userId: owner.id, planKey, status, source,
      currentPeriodStart: new Date("2026-09-01"), currentPeriodEnd: new Date(end) } });
    const service = new UsageBillingService(repository, { list: () => Promise.resolve(DEFAULT_PLAN_CATALOG) });
    const entitlement = await service.getCurrentPlan(owner.id, now);
    expect(entitlement.key).toBe(expected);
    expect(entitlement).toEqual((await service.getSummary(owner.id, now)).currentPlan);
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
      database.planSubscription.create({ data: { currentPeriodEnd: new Date("2026-10-01"), currentPeriodStart: new Date("2026-09-01"), planKey: "STUDIO_PRO", source: "MANUAL_ADMIN", status: "ACTIVE", userId: owner.id } }),
    ]);

    await expect(repository.getOwnedSummary(owner.id, "2026-09", new Date("2026-09-20"))).resolves.toEqual({ imageUsage: 2, planKey: "STUDIO_PRO", storageUsedBytes: 1_024n, uploadSessionUsage: 1 });
  });
});
