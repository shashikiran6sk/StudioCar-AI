import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { ProcessingOptionsSchema } from "../../../../packages/contracts/src/processing";
import { createDatabaseClient } from "../../../../packages/database-runtime/src/client";
import { PrismaProcessingJobRepository } from "../../../../apps/web/src/server/db/repositories/processing-job-repository";
import { PrismaProcessingOutboxRepository } from "../../../../apps/web/src/server/db/repositories/processing-outbox-repository";
import { PrismaProcessingWorkerRepository } from "../../../../packages/database-runtime/src/repositories/processing-worker-repository";
import { ProcessingProvider } from "../../../../packages/database-runtime/generated/prisma/client";
import { createProcessingBatchRequestHash } from "../../../../packages/processing/src/create-processing-batch-request-hash";
import { createProcessingJobIdempotencyKey } from "../../../../packages/processing/src/create-processing-job-idempotency-key";
import { createProcessingUsageIdempotencyKey } from "../../../../packages/processing/src/create-processing-usage-idempotency-key";
import type { CompleteProcessingJobInput } from "../../../../packages/processing/src/processing-worker.types";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const OWNER_EMAIL = "worker-owner@integration.studiocar.test";
const NOW = new Date("2099-09-20T00:00:00.000Z");
const CLAIM_EXPIRES_AT = new Date("2099-09-20T00:05:00.000Z");
const NEXT_ATTEMPT_AT = new Date("2099-09-20T00:01:00.000Z");

databaseDescribe("PrismaProcessingWorkerRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let reservations: PrismaProcessingJobRepository;
  let outbox: PrismaProcessingOutboxRepository;
  let workers: PrismaProcessingWorkerRepository;

  beforeAll(() => {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for integration tests.");
    }
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    reservations = new PrismaProcessingJobRepository(database);
    outbox = new PrismaProcessingOutboxRepository(database);
    workers = new PrismaProcessingWorkerRepository(database);
  });

  afterEach(async () => {
    await database.user.deleteMany({ where: { primaryEmail: OWNER_EMAIL } });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  async function createOwner(): Promise<string> {
    const owner = await database.user.create({
      data: { primaryEmail: OWNER_EMAIL },
    });
    return owner.id;
  }

  async function createQueuedBatch(
    batchKey: string,
    imageCount: number,
    existingOwnerId?: string,
  ) {
    const ownerId = existingOwnerId ?? (await createOwner());
    const vehicle = await database.vehicle.create({
      data: { userId: ownerId, name: "Worker lifecycle vehicle" },
    });
    const assetIds = Array.from({ length: imageCount }, () => randomUUID());
    for (const assetId of assetIds) {
      await database.imageAsset.create({
        data: {
          id: assetId,
          userId: ownerId,
          vehicleId: vehicle.id,
          status: "UPLOADED",
          originalObjectKey: `users/${ownerId}/vehicles/${vehicle.id}/assets/${assetId}/original/source.jpg`,
          originalFilename: "source.jpg",
          mimeType: "image/jpeg",
          sizeBytes: 1_024,
          uploadExpiresAt: new Date("2099-09-19T23:55:00.000Z"),
          uploadedAt: new Date("2099-09-19T23:50:00.000Z"),
        },
      });
    }
    const options = ProcessingOptionsSchema.parse({});
    const request = { vehicleId: vehicle.id, assetIds, options };
    const reserved = await reservations.reserveBatchOwned({
      allowance: {
        imageCapacity: 100,
        maxImagesPerBatch: 20,
        allowanceBillingPeriodKey: null,
      },
      userId: ownerId,
      vehicleId: vehicle.id,
      batchIdempotencyKey: batchKey,
      batchLabel: null,
      batchRequestHash: createProcessingBatchRequestHash(request),
      provider: ProcessingProvider.REMOVEBG,
      usageBillingPeriodKey: "2099-09",
      usageIdempotencyKey: `usage:upload-session:${batchKey}`,
      options,
      jobs: assetIds.map((assetId, displayOrder) => ({
        assetId,
        displayOrder,
        idempotencyKey: createProcessingJobIdempotencyKey(batchKey, assetId),
      })),
    });
    if (reserved.kind !== "CREATED") {
      throw new Error("Expected a processing job reservation.");
    }
    for (const job of reserved.jobs) {
      await database.processingJob.update({
        where: { id: job.id },
        data: { queuedAt: NOW, status: "QUEUED" },
      });
      await database.processingOutboxMessage.update({
        where: { jobId: job.id },
        data: {
          publishedAt: NOW,
          queueMessageId: `queue-${job.id}`,
        },
      });
    }
    return {
      jobs: reserved.jobs.map((job) => ({ assetId: job.imageAssetId, jobId: job.id })),
      ownerId,
      vehicleId: vehicle.id,
    };
  }

  async function createQueuedJob(batchKey: string) {
    const batch = await createQueuedBatch(batchKey, 1);
    const job = batch.jobs[0];
    if (!job) throw new Error("Expected one processing job.");
    return { ...job, ownerId: batch.ownerId, vehicleId: batch.vehicleId };
  }

  function completionInput(
    record: { assetId: string; jobId: string; ownerId: string; vehicleId: string },
    attemptNumber: number,
    workerId: string,
  ): CompleteProcessingJobInput {
    const prefix = `users/${record.ownerId}/vehicles/${record.vehicleId}/assets/${record.assetId}/jobs/${record.jobId}`;
    return {
      attemptNumber,
      completedAt: new Date("2099-09-20T00:00:10.000Z"),
      jobId: record.jobId,
      output: {
        checksumSha256: "b".repeat(64),
        height: 900,
        mimeType: "image/png",
        objectKey: `${prefix}/processed.png`,
        outputFormat: "PNG",
        previewObjectKey: `${prefix}/preview.webp`,
        sizeBytes: 2_048n,
        width: 1_600,
      },
      providerLatencyMilliseconds: 900,
      providerRequestId: `removebg-request-${record.jobId}`,
      usageBillingPeriodKey: "2099-09",
      usageIdempotencyKey: createProcessingUsageIdempotencyKey(record.jobId),
      workerId,
    };
  }

  it("reports a job whose message arrived before it was queued, then claims it once queued", async () => {
    const record = await createQueuedJob("worker-early-message-batch");
    // The state a fast worker sees between the queue send and the
    // dispatcher recording the job as queued.
    await database.processingJob.update({
      where: { id: record.jobId },
      data: { queuedAt: null, status: "CREATED" },
    });
    const claim = {
      claimExpiresAt: CLAIM_EXPIRES_AT,
      jobId: record.jobId,
      now: NOW,
      workerId: "worker-early",
    };

    await expect(workers.claimJob(claim)).resolves.toEqual({
      kind: "AWAITING_PUBLICATION",
    });
    await expect(
      database.processingJob.findUnique({
        where: { id: record.jobId },
        select: { attemptCount: true, status: true },
      }),
    ).resolves.toEqual({ attemptCount: 0, status: "CREATED" });

    await database.processingJob.update({
      where: { id: record.jobId },
      data: { queuedAt: NOW, status: "QUEUED" },
    });
    await expect(workers.claimJob(claim)).resolves.toMatchObject({
      kind: "CLAIMED",
    });
  });

  it("claims duplicate deliveries once and atomically completes usage", async () => {
    const record = await createQueuedJob("worker-completion-batch");
    const [first, duplicate] = await Promise.all([
      workers.claimJob({
        claimExpiresAt: CLAIM_EXPIRES_AT,
        jobId: record.jobId,
        now: NOW,
        workerId: "worker-completion-1",
      }),
      workers.claimJob({
        claimExpiresAt: CLAIM_EXPIRES_AT,
        jobId: record.jobId,
        now: NOW,
        workerId: "worker-completion-2",
      }),
    ]);
    const claimed = [first, duplicate].find((result) => result.kind === "CLAIMED");
    if (!claimed || claimed.kind !== "CLAIMED") {
      throw new Error("Expected exactly one worker claim.");
    }
    expect([first.kind, duplicate.kind].sort()).toEqual([
      "CLAIMED",
      "NOT_READY",
    ]);

    const completedAt = new Date("2099-09-20T00:00:10.000Z");
    const completion = await workers.completeJob({
      attemptNumber: claimed.job.attemptNumber,
      completedAt,
      jobId: record.jobId,
      output: {
        checksumSha256: "b".repeat(64),
        height: 900,
        mimeType: "image/png",
        objectKey: `users/${record.ownerId}/vehicles/${record.vehicleId}/assets/${record.assetId}/jobs/${record.jobId}/processed.png`,
        outputFormat: "PNG",
        previewObjectKey: `users/${record.ownerId}/vehicles/${record.vehicleId}/assets/${record.assetId}/jobs/${record.jobId}/preview.webp`,
        sizeBytes: 2_048n,
        width: 1_600,
      },
      providerLatencyMilliseconds: 900,
      providerRequestId: "removebg-request-complete",
      usageBillingPeriodKey: "2099-09",
      usageIdempotencyKey: createProcessingUsageIdempotencyKey(record.jobId),
      workerId:
        first.kind === "CLAIMED"
          ? "worker-completion-1"
          : "worker-completion-2",
    });
    expect(completion.kind).toBe("COMPLETED");
    await expect(
      workers.claimJob({
        claimExpiresAt: CLAIM_EXPIRES_AT,
        jobId: record.jobId,
        now: completedAt,
        workerId: "worker-duplicate-after-completion",
      }),
    ).resolves.toEqual({ kind: "TERMINAL" });
    await expect(
      database.usageEvent.count({
        where: {
          jobId: record.jobId,
          type: "BACKGROUND_REMOVAL_COMPLETED",
        },
      }),
    ).resolves.toBe(1);
    await expect(
      database.processedAsset.count({ where: { jobId: record.jobId } }),
    ).resolves.toBe(1);
    await expect(
      database.vehicle.findUnique({
        where: { id: record.vehicleId },
        select: { status: true },
      }),
    ).resolves.toEqual({ status: "READY" });
  });

  it("republishes retryable work and terminally rejects an invalid image", async () => {
    const record = await createQueuedJob("worker-retry-batch");
    const firstClaim = await workers.claimJob({
      claimExpiresAt: CLAIM_EXPIRES_AT,
      jobId: record.jobId,
      now: NOW,
      workerId: "worker-retry-1",
    });
    if (firstClaim.kind !== "CLAIMED") {
      throw new Error("Expected the first processing claim.");
    }
    await expect(
      workers.failJob({
        attemptNumber: firstClaim.job.attemptNumber,
        errorCode: "PROVIDER_RATE_LIMITED",
        errorMessage: "Provider rate limited the request.",
        failedAt: NOW,
        jobId: record.jobId,
        nextAttemptAt: NEXT_ATTEMPT_AT,
        providerLatencyMilliseconds: 25,
        providerRequestId: null,
        retryable: true,
        workerId: "worker-retry-1",
      }),
    ).resolves.toEqual({
      kind: "RETRY_SCHEDULED",
      nextAttemptAt: NEXT_ATTEMPT_AT,
    });

    const retryMessages = await outbox.claimPendingOutbox({
      claimExpiresAt: new Date("2099-09-20T00:02:00.000Z"),
      claimToken: "worker-retry-publisher",
      jobIds: [record.jobId],
      limit: 1,
      now: NEXT_ATTEMPT_AT,
    });
    const retryMessage = retryMessages[0];
    if (!retryMessage) throw new Error("Expected the retry outbox message.");
    await expect(
      outbox.markOutboxPublished({
        claimToken: "worker-retry-publisher",
        messageId: retryMessage.id,
        publishedAt: NEXT_ATTEMPT_AT,
        queueMessageId: "retry-queue-message",
      }),
    ).resolves.toBe(true);

    const secondClaim = await workers.claimJob({
      claimExpiresAt: new Date("2099-09-20T00:06:00.000Z"),
      jobId: record.jobId,
      now: NEXT_ATTEMPT_AT,
      workerId: "worker-retry-2",
    });
    if (secondClaim.kind !== "CLAIMED") {
      throw new Error("Expected the second processing claim.");
    }
    await expect(
      workers.failJob({
        attemptNumber: secondClaim.job.attemptNumber,
        errorCode: "INVALID_IMAGE",
        errorMessage: "The uploaded image could not be decoded.",
        failedAt: NEXT_ATTEMPT_AT,
        jobId: record.jobId,
        nextAttemptAt: new Date("2099-09-20T00:02:00.000Z"),
        providerLatencyMilliseconds: null,
        providerRequestId: null,
        retryable: false,
        workerId: "worker-retry-2",
      }),
    ).resolves.toEqual({ kind: "FAILED" });
    await expect(
      database.processingAttempt.count({ where: { jobId: record.jobId } }),
    ).resolves.toBe(2);
    await expect(
      database.imageAsset.findUnique({
        where: { id: record.assetId },
        select: { status: true },
      }),
    ).resolves.toEqual({ status: "INVALID" });
    await expect(
      database.vehicle.findUnique({
        where: { id: record.vehicleId },
        select: { status: true },
      }),
    ).resolves.toEqual({ status: "PARTIALLY_FAILED" });
    await expect(
      database.usageEvent.count({
        where: {
          jobId: record.jobId,
          type: "BACKGROUND_REMOVAL_COMPLETED",
        },
      }),
    ).resolves.toBe(0);
  });

  it("clears attention once a re-process of the failed batch completes", async () => {
    const record = await createQueuedJob("worker-reprocess-batch");
    // An earlier batch of this vehicle failed; the user then re-processed it.
    await database.processingJob.create({
      data: {
        batchIdempotencyKey: "worker-earlier-failed-batch",
        createdAt: new Date("2000-01-01T00:00:00.000Z"),
        errorCode: "PROVIDER_TIMEOUT",
        failedAt: new Date("2000-01-01T00:01:00.000Z"),
        idempotencyKey: "worker-earlier-failed-job",
        imageAssetId: record.assetId,
        options: ProcessingOptionsSchema.parse({}),
        provider: "REMOVEBG",
        status: "FAILED",
        userId: record.ownerId,
        vehicleId: record.vehicleId,
      },
    });
    const claim = await workers.claimJob({
      claimExpiresAt: CLAIM_EXPIRES_AT,
      jobId: record.jobId,
      now: NOW,
      workerId: "worker-reprocess",
    });
    if (claim.kind !== "CLAIMED") throw new Error("Expected a processing claim.");

    // A transient failure retries automatically and never asks for attention.
    await workers.failJob({
      attemptNumber: claim.job.attemptNumber,
      errorCode: "PROVIDER_UNAVAILABLE",
      errorMessage: "Provider unavailable.",
      failedAt: NOW,
      jobId: record.jobId,
      nextAttemptAt: NEXT_ATTEMPT_AT,
      providerLatencyMilliseconds: 10,
      providerRequestId: null,
      retryable: true,
      workerId: "worker-reprocess",
    });
    await expect(
      database.vehicle.findUnique({
        where: { id: record.vehicleId },
        select: { status: true },
      }),
    ).resolves.toEqual({ status: "PROCESSING" });

    await database.processingJob.update({
      where: { id: record.jobId },
      data: { status: "QUEUED" },
    });
    const retry = await workers.claimJob({
      claimExpiresAt: new Date("2099-09-20T00:06:00.000Z"),
      jobId: record.jobId,
      now: NEXT_ATTEMPT_AT,
      workerId: "worker-reprocess-2",
    });
    if (retry.kind !== "CLAIMED") throw new Error("Expected the retry claim.");
    await workers.completeJob({
      attemptNumber: retry.job.attemptNumber,
      completedAt: NEXT_ATTEMPT_AT,
      jobId: record.jobId,
      output: {
        checksumSha256: "c".repeat(64),
        height: 900,
        mimeType: "image/png",
        objectKey: `users/${record.ownerId}/vehicles/${record.vehicleId}/reprocess.png`,
        outputFormat: "PNG",
        previewObjectKey: `users/${record.ownerId}/vehicles/${record.vehicleId}/reprocess-preview.webp`,
        sizeBytes: 2_048n,
        width: 1_600,
      },
      providerLatencyMilliseconds: 900,
      providerRequestId: "removebg-request-reprocess",
      usageBillingPeriodKey: "2099-09",
      usageIdempotencyKey: createProcessingUsageIdempotencyKey(record.jobId),
      workerId: "worker-reprocess-2",
    });

    await expect(
      database.vehicle.findUnique({
        where: { id: record.vehicleId },
        select: { status: true },
      }),
    ).resolves.toEqual({ status: "READY" });
    await expect(
      database.processingJob.count({
        where: { vehicleId: record.vehicleId, status: "FAILED" },
      }),
    ).resolves.toBe(1);
  });

  it("marks a vehicle READY once when its final jobs complete concurrently", async () => {
    const ownerId = await createOwner();
    // Several vehicles widen the window in which two final-job transactions
    // overlap; each must still reach READY exactly once.
    const batches = await Promise.all(
      Array.from({ length: 4 }, (_, index) =>
        createQueuedBatch(`worker-concurrent-batch-${index}`, 2, ownerId),
      ),
    );
    const records = batches.flatMap((batch) =>
      batch.jobs.map((job) => ({ ...job, ownerId, vehicleId: batch.vehicleId })),
    );
    const claims = await Promise.all(
      records.map(async (record) => {
        const workerId = `worker-concurrent-${record.jobId}`;
        const claim = await workers.claimJob({
          claimExpiresAt: CLAIM_EXPIRES_AT,
          jobId: record.jobId,
          now: NOW,
          workerId,
        });
        if (claim.kind !== "CLAIMED") throw new Error("Expected a processing claim.");
        return { attemptNumber: claim.job.attemptNumber, record, workerId };
      }),
    );

    const completions = await Promise.all(
      claims.map(({ attemptNumber, record, workerId }) =>
        workers.completeJob(completionInput(record, attemptNumber, workerId)),
      ),
    );
    expect(completions.map((completion) => completion.kind)).toEqual(
      records.map(() => "COMPLETED"),
    );

    // A duplicate delivery of an already completed job changes nothing.
    const firstClaim = claims[0];
    if (!firstClaim) throw new Error("Expected a claim.");
    await expect(
      workers.completeJob(
        completionInput(firstClaim.record, firstClaim.attemptNumber, firstClaim.workerId),
      ),
    ).resolves.toMatchObject({ kind: "ALREADY_COMPLETED" });

    const vehicleIds = batches.map((batch) => batch.vehicleId);
    const jobIds = records.map((record) => record.jobId);
    await expect(
      database.vehicle.findMany({
        where: { id: { in: vehicleIds } },
        select: { status: true },
      }),
    ).resolves.toEqual(vehicleIds.map(() => ({ status: "READY" })));
    await expect(
      database.processedAsset.count({ where: { jobId: { in: jobIds } } }),
    ).resolves.toBe(records.length);
    await expect(
      database.usageEvent.count({
        where: { jobId: { in: jobIds }, type: "BACKGROUND_REMOVAL_COMPLETED" },
      }),
    ).resolves.toBe(records.length);
    await expect(
      database.processingJob.count({
        where: { id: { in: jobIds }, status: "COMPLETED" },
      }),
    ).resolves.toBe(records.length);
  });
});
