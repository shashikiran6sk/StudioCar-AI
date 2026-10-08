import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ProcessingOptionsSchema } from "../../../../packages/contracts/src/processing";
import { createDatabaseClient } from "../../../../packages/database-runtime/src/client";
import { ProcessingProvider } from "../../../../packages/database-runtime/generated/prisma/client";
import { releaseCreditAllocation } from "../../../../packages/database-runtime/src/repositories/release-credit-allocation";
import { settleCreditAllocation } from "../../../../packages/database-runtime/src/repositories/settle-credit-allocation";
import { PrismaProcessingJobRepository } from "../../../../apps/web/src/server/db/repositories/processing-job-repository";
import { PrismaProcessingWorkerRepository } from "../../../../packages/database-runtime/src/repositories/processing-worker-repository";
import { getBillingStatus } from "../../../../apps/web/src/server/billing/get-billing-status";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;

databaseDescribe("paid credit reservations", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let userId: string;
  const suffix = randomUUID();

  beforeAll(async () => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required.");
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    const user = await database.user.create({ data: { primaryEmail: `credit-${suffix}@example.test` } });
    userId = user.id;
    await database.creditLedger.create({ data: { userId, type: "PURCHASE_GRANT", amount: 8, referenceId: `grant-${suffix}` } });
  });

  afterAll(async () => {
    if (!database) return;
    await database.creditAllocation.deleteMany({ where: { userId } });
    await database.creditLedger.deleteMany({ where: { userId } });
    await database.user.delete({ where: { id: userId } });
    await database.$disconnect();
  });

  it("serializes simultaneous batches and prevents overspending cumulative purchased credits", async () => {
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
        requestId: randomUUID(),
        allowance: { imageCapacity: 100, maxImagesPerBatch: 20 },
        batchIdempotencyKey: `paid-batch-${suffix}-${String(number)}`,
        batchLabel: null,
        batchRequestHash: "a".repeat(64),
        jobs: assetIds.map((assetId, displayOrder) => ({ assetId, displayOrder, idempotencyKey: `paid-job-${suffix}-${String(number)}-${String(displayOrder)}` })),
        options, provider: ProcessingProvider.LEONARDO,
        usageBillingPeriodKey: "2026-09",
        usageIdempotencyKey: `paid-usage-${suffix}-${String(number)}`,
        userId, vehicleId: vehicle.id,
      };
    }));
    const results = await Promise.all(commands.map((command) => repository.reserveBatchOwned(command)));
    expect(results.map((result) => result.kind).sort()).toEqual(["ALLOWANCE_EXHAUSTED", "CREATED"]);
    const accepted = results.find((result) => result.kind === "CREATED");
    if (!accepted) throw new Error("Expected one accepted paid batch.");
    const acceptedCommand = commands.find((command) => command.vehicleId === accepted.jobs[0]?.vehicleId);
    if (!acceptedCommand) throw new Error("Expected the accepted batch command.");
    expect(accepted.jobs.map((job) => job.imageAssetId)).toEqual(acceptedCommand.jobs.map((job) => job.assetId));
    expect(accepted.jobs.map((job) => job.requestId)).toEqual(acceptedCommand.jobs.map(() => acceptedCommand.requestId));
    const replay = await repository.reserveBatchOwned(acceptedCommand);
    if (replay.kind !== "EXISTING") throw new Error("Expected an idempotent paid batch replay.");
    expect(replay.jobs.map((job) => job.id)).toEqual(accepted.jobs.map((job) => job.id));
    expect(await database.creditAllocation.count({ where: { userId } })).toBe(5);
    const ledger = await database.creditLedger.aggregate({ where: { userId }, _sum: { amount: true } });
    expect(ledger._sum.amount).toBe(3);
    const allocations = await database.creditAllocation.findMany({ where: { userId }, orderBy: { id: "asc" } });
    const first = allocations[0]; const second = allocations[1];
    if (!first || !second) throw new Error("Expected paid allocations.");
    await database.$transaction((transaction) => settleCreditAllocation(transaction, first.jobId));
    await Promise.all([0, 1].map(() => database.$transaction((transaction) => releaseCreditAllocation(transaction, second.jobId))));
    await database.$transaction((transaction) => releaseCreditAllocation(transaction, first.jobId));
    const status = await getBillingStatus(database, userId);
    expect(status.purchasedCredits).toBe(4);
    expect(await database.creditLedger.count({ where: { userId, type: "PROCESSING_REFUND" } })).toBe(1);
  });
  it("keeps paid reservations during retry and restores them once on terminal failure", async () => {
    const allocation = await database.creditAllocation.findFirstOrThrow({ where: { userId, status: "RESERVED" } });
    const workers = new PrismaProcessingWorkerRepository(database); const now = new Date();
    const before = (await getBillingStatus(database, userId)).purchasedCredits;
    await database.processingJob.update({ where: { id: allocation.jobId }, data: { status: "QUEUED", queuedAt: now } });
    const claim = await workers.claimJob({ jobId: allocation.jobId, provider: "LEONARDO", workerId: "paid-retry", now, claimExpiresAt: new Date(now.getTime() + 60000) });
    if (claim.kind !== "CLAIMED") throw new Error("Expected claim");
    const failed = { jobId: allocation.jobId, attemptNumber: claim.job.attemptNumber, workerId: "paid-retry", errorCode: "PROVIDER_NETWORK_ERROR", errorMessage: "Temporary provider failure.", failedAt: now, nextAttemptAt: now, providerLatencyMilliseconds: null, providerRequestId: null, retryable: true };
    expect((await workers.failJob(failed)).kind).toBe("RETRY_SCHEDULED");
    expect((await getBillingStatus(database, userId)).purchasedCredits).toBe(before);
    expect((await database.creditAllocation.findUniqueOrThrow({ where: { jobId: allocation.jobId } })).status).toBe("RESERVED");
    await database.processingJob.update({ where: { id: allocation.jobId }, data: { status: "QUEUED", queuedAt: now } });
    const retry = await workers.claimJob({ jobId: allocation.jobId, provider: "LEONARDO", workerId: "paid-terminal", now, claimExpiresAt: new Date(now.getTime() + 60000) });
    if (retry.kind !== "CLAIMED") throw new Error("Expected retry claim");
    const terminal = { ...failed, attemptNumber: retry.job.attemptNumber, workerId: "paid-terminal", retryable: false };
    expect((await workers.failJob(terminal)).kind).toBe("FAILED");
    await workers.failJob(terminal);
    expect((await getBillingStatus(database, userId)).purchasedCredits).toBe(before + 1);
  });
  it("completes a paid job once without an additional debit or free-credit consumption", async () => {
    const allocation = await database.creditAllocation.findFirstOrThrow({ where: { userId, status: "RESERVED" } });
    const workers = new PrismaProcessingWorkerRepository(database); const now = new Date();
    const before = (await getBillingStatus(database, userId)).purchasedCredits;
    await database.processingJob.update({ where: { id: allocation.jobId }, data: { status: "QUEUED", queuedAt: now } });
    const claim = await workers.claimJob({ jobId: allocation.jobId, provider: "LEONARDO", workerId: "paid-complete", now, claimExpiresAt: new Date(now.getTime() + 60000) });
    if (claim.kind !== "CLAIMED") throw new Error("Expected claim");
    const completion = { attemptNumber: claim.job.attemptNumber, completedAt: now, jobId: allocation.jobId,
      output: { checksumSha256: null, height: 100, width: 100, mimeType: "image/webp", objectKey: `users/${userId}/paid.webp`, previewObjectKey: `users/${userId}/paid-preview.webp`, outputFormat: "WEBP", sizeBytes: 1000n },
      providerLatencyMilliseconds: null, providerRequestId: null, usageBillingPeriodKey: "2026-10", usageIdempotencyKey: `paid-complete-${suffix}`, workerId: "paid-complete",
    } satisfies Parameters<typeof workers.completeJob>[0];
    expect((await workers.completeJob(completion)).kind).toBe("COMPLETED");
    expect((await workers.completeJob(completion)).kind).toBe("ALREADY_COMPLETED");
    expect((await getBillingStatus(database, userId)).purchasedCredits).toBe(before);
    expect(await database.usageEvent.count({ where: { jobId: allocation.jobId, type: "BACKGROUND_REMOVAL_COMPLETED" } })).toBe(1);
    expect((await database.creditAllocation.findUniqueOrThrow({ where: { jobId: allocation.jobId } })).status).toBe("CONSUMED");
  });

});
