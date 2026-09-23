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

  async function createQueuedJob(batchKey: string) {
    const owner = await database.user.create({
      data: { primaryEmail: OWNER_EMAIL },
    });
    const vehicle = await database.vehicle.create({
      data: { userId: owner.id, name: "Worker lifecycle vehicle" },
    });
    const assetId = randomUUID();
    await database.imageAsset.create({
      data: {
        id: assetId,
        userId: owner.id,
        vehicleId: vehicle.id,
        status: "UPLOADED",
        originalObjectKey: `users/${owner.id}/vehicles/${vehicle.id}/assets/${assetId}/original/source.jpg`,
        originalFilename: "source.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1_024,
        uploadExpiresAt: new Date("2099-09-19T23:55:00.000Z"),
        uploadedAt: new Date("2099-09-19T23:50:00.000Z"),
      },
    });
    const options = ProcessingOptionsSchema.parse({
      backgroundId: "DARK_STUDIO",
      floorId: "DARK_TURNTABLE",
    });
    const request = { vehicleId: vehicle.id, assetIds: [assetId], options };
    const reserved = await reservations.reserveBatchOwned({
      allowance: {
        imageCapacity: 100,
        maxImagesPerBatch: 20,
        allowanceBillingPeriodKey: null,
      },
      userId: owner.id,
      vehicleId: vehicle.id,
      batchIdempotencyKey: batchKey,
      batchRequestHash: createProcessingBatchRequestHash(request),
      provider: ProcessingProvider.REMOVEBG,
      usageBillingPeriodKey: "2099-09",
      usageIdempotencyKey: `usage:upload-session:${batchKey}`,
      options,
      jobs: [
        {
          assetId,
          displayOrder: 0,
          idempotencyKey: createProcessingJobIdempotencyKey(batchKey, assetId),
        },
      ],
    });
    if (reserved.kind !== "CREATED") {
      throw new Error("Expected a processing job reservation.");
    }
    const job = reserved.jobs[0];
    if (!job) throw new Error("Expected one processing job.");
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
    return { assetId, jobId: job.id, ownerId: owner.id, vehicleId: vehicle.id };
  }

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
    // The queue message names only the job; the worker's claim reads both
    // semantic IDs back from PostgreSQL, the turntable included.
    expect(claimed.job.options).toMatchObject({
      backgroundId: "DARK_STUDIO",
      floorId: "DARK_TURNTABLE",
    });

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
    await expect(
      database.emailOutboxMessage.findMany({
        where: { vehicleId: record.vehicleId },
        select: {
          batchIdempotencyKey: true,
          recipient: true,
          status: true,
          type: true,
          vehicleName: true,
        },
      }),
    ).resolves.toEqual([
      {
        batchIdempotencyKey: "worker-completion-batch",
        recipient: OWNER_EMAIL,
        status: "PENDING",
        type: "PROCESSING_COMPLETED",
        vehicleName: "Worker lifecycle vehicle",
      },
    ]);
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
    await expect(
      database.emailOutboxMessage.count({
        where: { vehicleId: record.vehicleId },
      }),
    ).resolves.toBe(0);
  });
});
