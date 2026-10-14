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
const REQUEST_ID = "7e38d07b-c3c3-4ce0-9a50-91055e9bf3de";
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

  it("claims disjoint bounded batches and acknowledges only current successful leases", async () => {
    const owner = await database.user.create({ data: { primaryEmail: ownerEmail } });
    const vehicle = await database.vehicle.create({ data: { userId: owner.id, name: "Batch publication fixture" } });
    const ids = Array.from({ length: 20 }, () => randomUUID());
    await database.imageAsset.createMany({ data: ids.map((id) => ({ id, userId: owner.id, vehicleId: vehicle.id,
      status: "UPLOADED", mimeType: "image/jpeg", originalFilename: "fixture.jpg", originalObjectKey: `users/${owner.id}/${id}`,
      sizeBytes: 1024, uploadExpiresAt: CLAIM_NOW })) });
    const created = await database.processingJob.createManyAndReturn({ data: ids.map((id) => ({ userId: owner.id,
      vehicleId: vehicle.id, imageAssetId: id, provider: "LEONARDO", options: ProcessingOptionsSchema.parse({}), idempotencyKey: id,
    })), select: { id: true } });
    await database.processingOutboxMessage.createMany({ data: created.map((job) => ({ jobId: job.id })) });
    const jobIds = created.map((job) => job.id);
    const base = { jobIds, now: CLAIM_NOW, claimExpiresAt: new Date(CLAIM_NOW.getTime() + 1000), limit: 10 };
    const [first, second] = await Promise.all([
      outbox.claimPendingOutbox({ ...base, claimToken: "batch-first" }),
      outbox.claimPendingOutbox({ ...base, claimToken: "batch-second" }),
    ]);
    expect(first).toHaveLength(10);
    expect(second).toHaveLength(10);
    expect(new Set([...first, ...second].map((message) => message.id)).size).toBe(20);
    expect(await database.processingJob.count({ where: { userId: owner.id, status: "CREATED" } })).toBe(20);
    const commands = first.map((message) => ({ messageId: message.id, claimToken: "batch-first", publishedAt: CLAIM_NOW, queueMessageId: randomUUID() }));
    const successful = commands.slice(0, 9);
    const stale = commands[9];
    if (!stale) throw new Error("Missing fixture");
    expect(await outbox.markOutboxPublishedBatch([...successful, { ...stale, claimToken: "obsolete" }])).toHaveLength(9);
    expect(await outbox.markOutboxPublishedBatch(successful)).toEqual([]);
    expect(await database.processingJob.count({ where: { userId: owner.id, status: "QUEUED" } })).toBe(9);
    // Simulate send success followed by a crash before DB ack: expired leases are
    // claimable again, and the old publisher cannot acknowledge the replacement.
    const recovered = await outbox.claimPendingOutbox({ ...base, limit: 20, now: new Date(CLAIM_NOW.getTime() + 2000),
      claimExpiresAt: new Date(CLAIM_NOW.getTime() + 10_000), claimToken: "batch-recovered" });
    expect(recovered).toHaveLength(11);
    expect(await outbox.markOutboxPublishedBatch([stale])).toEqual([]);
    const cancelled = recovered[0];
    if (!cancelled) throw new Error("Missing cancellation fixture");
    await database.processingJob.update({ where: { id: cancelled.jobId }, data: { status: "CANCELLED" } });
    expect(await outbox.markOutboxPublishedBatch(recovered.map((message) => ({ messageId: message.id,
      claimToken: "batch-recovered", publishedAt: CLAIM_NOW, queueMessageId: randomUUID() })))).toHaveLength(10);
    expect(await database.processingJob.count({ where: { userId: owner.id, status: "QUEUED" } })).toBe(19);
    expect(await database.processingJob.findUniqueOrThrow({ where: { id: cancelled.jobId }, select: { status: true } })).toEqual({ status: "CANCELLED" });
    expect(await database.usageEvent.count({ where: { userId: owner.id } })).toBe(0);
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
    const options = ProcessingOptionsSchema.parse({});
    const request = { vehicleId: vehicle.id, assetIds: [assetId], options };
    const reserved = await jobs.reserveBatchOwned({
      requestId: REQUEST_ID,
      allowance: {
        imageCapacity: 100,
        maxImagesPerBatch: 20,
      },
      userId: owner.id,
      vehicleId: vehicle.id,
      batchIdempotencyKey,
      batchLabel: null,
      batchRequestHash: createProcessingBatchRequestHash(request),
      provider: ProcessingProvider.LEONARDO,
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

    // An HTTP replay cannot replace the original durable correlation.
    await database.processingJob
      .findUniqueOrThrow({ where: { id: job.id } })
      .then((stored) => {
        expect(stored.requestId).toBe(REQUEST_ID);
      });
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
    expect(claimed[0]?.job).toEqual({
      requestId: REQUEST_ID,
      batchIdempotencyKey,
    });
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
    expect(retryMessages[0]?.job).toEqual({
      requestId: REQUEST_ID,
      batchIdempotencyKey,
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
