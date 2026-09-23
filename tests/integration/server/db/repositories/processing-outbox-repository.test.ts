import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { ProcessingOptionsSchema } from "../../../../../packages/contracts/src/processing";
import { createDatabaseClient } from "../../../../../packages/database-runtime/src/client";
import { PrismaProcessingJobRepository } from "../../../../../apps/web/src/server/db/repositories/processing-job-repository";
import { PrismaProcessingOutboxRepository } from "../../../../../apps/web/src/server/db/repositories/processing-outbox-repository";
import { ProcessingProvider } from "../../../../../packages/database-runtime/generated/prisma/client";
import { createProcessingBatchRequestHash } from "../../../../../packages/processing/src/create-processing-batch-request-hash";
import { createProcessingJobIdempotencyKey } from "../../../../../packages/processing/src/create-processing-job-idempotency-key";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const ownerEmail = "outbox-owner@integration.studiocar.test";
const CLAIM_NOW = new Date("2099-09-19T12:00:00.000Z");
const RETRY_AT = new Date("2100-09-19T12:00:00.000Z");

databaseDescribe("PrismaProcessingOutboxRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let jobs: PrismaProcessingJobRepository;
  let outbox: PrismaProcessingOutboxRepository;

  beforeAll(() => {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for integration tests.");
    }
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    jobs = new PrismaProcessingJobRepository(database);
    outbox = new PrismaProcessingOutboxRepository(database);
  });

  afterEach(async () => {
    await database.user.deleteMany({ where: { primaryEmail: ownerEmail } });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("claims once, schedules retry, and atomically marks the job queued", async () => {
    const owner = await database.user.create({
      data: { primaryEmail: ownerEmail },
    });
    const vehicle = await database.vehicle.create({
      data: { userId: owner.id, name: "Outbox test vehicle" },
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
        sizeBytes: 1024,
        uploadExpiresAt: new Date("2026-09-19T12:05:00.000Z"),
        uploadedAt: new Date("2026-09-19T12:01:00.000Z"),
      },
    });
    const batchIdempotencyKey = "outbox-integration-batch-1";
    const options = ProcessingOptionsSchema.parse({
      backgroundId: "PREMIUM_WHITE",
      floorId: "WHITE_STUDIO",
    });
    const request = { vehicleId: vehicle.id, assetIds: [assetId], options };
    const reserved = await jobs.reserveBatchOwned({
      allowance: {
        imageCapacity: 100,
        maxImagesPerBatch: 20,
        allowanceBillingPeriodKey: null,
      },
      userId: owner.id,
      vehicleId: vehicle.id,
      batchIdempotencyKey,
      batchRequestHash: createProcessingBatchRequestHash(request),
      provider: ProcessingProvider.REMOVEBG,
      usageBillingPeriodKey: "2026-09",
      usageIdempotencyKey: `usage:upload-session:${batchIdempotencyKey}`,
      options,
      jobs: [
        {
          assetId,
          displayOrder: 0,
          idempotencyKey: createProcessingJobIdempotencyKey(
            batchIdempotencyKey,
            assetId,
          ),
        },
      ],
    });
    if (reserved.kind !== "CREATED") {
      throw new Error("Expected processing reservation to create a job.");
    }
    const job = reserved.jobs[0];
    if (!job) throw new Error("Expected one processing job.");

    const competingClaims = await Promise.all([
      outbox.claimPendingOutbox({
        claimExpiresAt: new Date("2099-09-19T12:01:00.000Z"),
        claimToken: "integration-claim-1",
        jobIds: [job.id],
        limit: 1,
        now: CLAIM_NOW,
      }),
      outbox.claimPendingOutbox({
        claimExpiresAt: new Date("2099-09-19T12:01:00.000Z"),
        claimToken: "integration-claim-2",
        jobIds: [job.id],
        limit: 1,
        now: CLAIM_NOW,
      }),
    ]);
    const claimed = competingClaims.flat();
    expect(claimed).toHaveLength(1);
    const message = claimed[0];
    if (!message?.claimToken) throw new Error("Expected an owned outbox claim.");

    await expect(
      outbox.releaseOutboxClaim({
        claimToken: message.claimToken,
        errorCode: "QUEUE_PUBLISH_FAILED",
        messageId: message.id,
        nextAttemptAt: RETRY_AT,
      }),
    ).resolves.toBe(true);
    await expect(
      outbox.claimPendingOutbox({
        claimExpiresAt: new Date("2099-09-19T12:02:00.000Z"),
        claimToken: "integration-claim-3",
        jobIds: [job.id],
        limit: 1,
        now: CLAIM_NOW,
      }),
    ).resolves.toEqual([]);

    const retryMessages = await outbox.claimPendingOutbox({
      claimExpiresAt: new Date("2100-09-19T12:02:00.000Z"),
      claimToken: "integration-claim-4",
      jobIds: [job.id],
      limit: 1,
      now: RETRY_AT,
    });
    const retryMessage = retryMessages[0];
    if (!retryMessage) throw new Error("Expected retry claim to become due.");
    await expect(
      outbox.markOutboxPublished({
        claimToken: "integration-claim-4",
        messageId: retryMessage.id,
        publishedAt: RETRY_AT,
        queueMessageId: "sqs-integration-message-1",
      }),
    ).resolves.toBe(true);
    await expect(
      database.processingJob.findUnique({
        where: { id: job.id },
        select: { queuedAt: true, status: true },
      }),
    ).resolves.toEqual({ queuedAt: RETRY_AT, status: "QUEUED" });
    await expect(
      database.processingOutboxMessage.findUnique({
        where: { jobId: job.id },
        select: { publishedAt: true, queueMessageId: true },
      }),
    ).resolves.toEqual({
      publishedAt: RETRY_AT,
      queueMessageId: "sqs-integration-message-1",
    });
  });
});
