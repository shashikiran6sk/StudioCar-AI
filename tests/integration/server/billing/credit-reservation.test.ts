import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ProcessingOptionsSchema } from "../../../../packages/contracts/src/processing";
import { createDatabaseClient } from "../../../../packages/database-runtime/src/client";
import { ProcessingProvider } from "../../../../packages/database-runtime/generated/prisma/client";
import { releaseCreditAllocation } from "../../../../packages/database-runtime/src/repositories/release-credit-allocation";
import { settleCreditAllocation } from "../../../../packages/database-runtime/src/repositories/settle-credit-allocation";
import { PrismaProcessingJobRepository } from "../../../../apps/web/src/server/db/repositories/processing-job-repository";
import { getBillingStatus } from "../../../../apps/web/src/server/billing/get-billing-status";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;

databaseDescribe("paid credit reservations", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let userId: string;
  let allowanceId: string;
  const suffix = randomUUID();

  beforeAll(async () => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required.");
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    const user = await database.user.create({ data: { primaryEmail: `credit-${suffix}@example.test` } });
    userId = user.id;
    const start = new Date(Date.now() - 60_000);
    const end = new Date(Date.now() + 86_400_000);
    const subscription = await database.planSubscription.create({
      data: { userId, source: "PAYMENT_PROVIDER", provider: "RAZORPAY", providerSubscriptionId: `sub_${suffix.replaceAll("-", "")}`,
        planKey: "STUDIO_PRO", status: "ACTIVE", currentPeriodStart: start, currentPeriodEnd: end },
    });
    const allowance = await database.subscriptionAllowance.create({
      data: { userId, subscriptionId: subscription.id, providerPaymentId: `pay_${suffix.replaceAll("-", "")}`, periodStart: start, periodEnd: end, allowance: 3 },
    });
    allowanceId = allowance.id;
    await database.creditLedger.create({ data: { userId, type: "PURCHASE_GRANT", amount: 5, referenceId: `grant-${suffix}` } });
  });

  afterAll(async () => {
    if (!database) return;
    await database.creditAllocation.deleteMany({ where: { userId } });
    await database.creditLedger.deleteMany({ where: { userId } });
    await database.subscriptionAllowance.deleteMany({ where: { userId } });
    await database.planSubscription.deleteMany({ where: { userId } });
    await database.user.delete({ where: { id: userId } });
    await database.$disconnect();
  });

  it("serializes simultaneous batches and spends Pro before purchased credits", async () => {
    const options = ProcessingOptionsSchema.parse({});
    const repository = new PrismaProcessingJobRepository(database);
    const commands = await Promise.all([0, 1].map(async (number) => {
      const vehicle = await database.vehicle.create({ data: { userId, name: `Credit vehicle ${String(number)}` } });
      const assetIds = await Promise.all(Array.from({ length: 5 }, async (_, index) => {
        const id = randomUUID();
        await database.imageAsset.create({
          data: { id, userId, vehicleId: vehicle.id, status: "UPLOADED", originalObjectKey: `users/${userId}/assets/${id}/source.jpg`,
            originalFilename: `source-${String(index)}.jpg`, mimeType: "image/jpeg", sizeBytes: 1000,
            uploadExpiresAt: new Date(Date.now() + 60_000), uploadedAt: new Date() },
        });
        return id;
      }));
      return {
        allowance: { imageCapacity: 400, maxImagesPerBatch: 20, allowanceBillingPeriodKey: "2026-09" },
        batchIdempotencyKey: `paid-batch-${suffix}-${String(number)}`,
        batchLabel: null,
        batchRequestHash: "a".repeat(64),
        jobs: assetIds.map((assetId, displayOrder) => ({ assetId, displayOrder, idempotencyKey: `paid-job-${suffix}-${String(number)}-${String(displayOrder)}` })),
        options, provider: ProcessingProvider.REMOVEBG,
        usageBillingPeriodKey: "2026-09",
        usageIdempotencyKey: `paid-usage-${suffix}-${String(number)}`,
        userId, vehicleId: vehicle.id,
      };
    }));
    const results = await Promise.all(commands.map((command) => repository.reserveBatchOwned(command)));
    expect(results.map((result) => result.kind).sort()).toEqual(["ALLOWANCE_EXHAUSTED", "CREATED"]);
    expect(await database.creditAllocation.count({ where: { userId, source: "PRO" } })).toBe(3);
    expect(await database.creditAllocation.count({ where: { userId, source: "PURCHASED" } })).toBe(2);
    const ledger = await database.creditLedger.aggregate({ where: { userId }, _sum: { amount: true } });
    expect(ledger._sum.amount).toBe(3);
    const proAllocation = await database.creditAllocation.findFirstOrThrow({ where: { userId, source: "PRO" } });
    const purchasedAllocation = await database.creditAllocation.findFirstOrThrow({ where: { userId, source: "PURCHASED" } });
    await database.$transaction(async (transaction) => {
      await settleCreditAllocation(transaction, proAllocation.jobId);
      await releaseCreditAllocation(transaction, purchasedAllocation.jobId);
    });
    expect((await database.subscriptionAllowance.findUniqueOrThrow({ where: { id: allowanceId } })).consumed).toBe(1);
    expect((await database.creditLedger.aggregate({ where: { userId }, _sum: { amount: true } }))._sum.amount).toBe(4);
    const status = await getBillingStatus(database, userId);
    expect(status.subscription?.remaining).toBe(0);
    expect(status.purchasedCredits).toBe(4);
  });
});
