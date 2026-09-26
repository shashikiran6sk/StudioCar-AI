import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { ProcessingOptionsSchema } from "../../../../packages/contracts/src/processing";
import { WorkerMessageSchema } from "../../../../packages/contracts/src/worker";
import { createDatabaseClient } from "../../../../packages/database-runtime/src/client";
import { PrismaProcessingWorkerRepository } from "../../../../packages/database-runtime/src/repositories/processing-worker-repository";
import { ProcessingWorker } from "../../../../packages/processing/src/processing-worker";
import { PrismaProcessingJobStatusRepository } from "../../../../apps/web/src/server/db/repositories/processing-job-status-repository";
import { PrismaProcessingOutboxRepository } from "../../../../apps/web/src/server/db/repositories/processing-outbox-repository";
import { ProcessingStatusService } from "../../../../apps/web/src/server/jobs/processing-status-service";
import { ProcessingJobExecutor } from "../../../../workers/image-processing/src/execution/processing-job-executor";
import { RemoveBgProvider } from "../../../../workers/image-processing/src/providers/remove-bg-provider";
import { handleProcessingQueueEvent } from "../../../../workers/image-processing/src/handle-processing-queue-event";
import type { ProcessingObjectStoragePort } from "../../../../workers/image-processing/src/storage/processing-object-storage.types";
import { logger } from "../../../../packages/observability/src/structured-logger";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const EMAIL = "credit-failure@integration.studiocar.test";
const NOW = new Date("2099-09-20T00:00:00.000Z");

databaseDescribe("exhausted remove.bg credits", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  beforeAll(() => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required.");
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
  });
  afterAll(async () => {
    vi.restoreAllMocks();
    await database.user.deleteMany({ where: { primaryEmail: EMAIL } });
    await database.$disconnect();
  });

  it("fails once, acknowledges SQS, preserves the original, exposes a generic reason and never republishes", async () => {
    const bytes = await sharp({
      create: { background: "#135579", channels: 3, height: 40, width: 60 },
    })
      .jpeg()
      .toBuffer();
    const owner = await database.user.create({ data: { primaryEmail: EMAIL } });
    const vehicle = await database.vehicle.create({
      data: {
        userId: owner.id,
        name: "Credit failure vehicle",
        status: "PROCESSING",
      },
    });
    const asset = await database.imageAsset.create({
      data: {
        userId: owner.id,
        vehicleId: vehicle.id,
        originalFilename: "source.jpg",
        originalObjectKey: "credit-failure/source.jpg",
        mimeType: "image/jpeg",
        sizeBytes: bytes.byteLength,
        status: "UPLOADED",
        uploadExpiresAt: NOW,
      },
    });
    const requestId = randomUUID();
    const job = await database.processingJob.create({
      data: {
        userId: owner.id,
        vehicleId: vehicle.id,
        imageAssetId: asset.id,
        provider: "REMOVEBG",
        options: ProcessingOptionsSchema.parse({}),
        status: "QUEUED",
        idempotencyKey: "credit-failure-image",
        batchIdempotencyKey: "credit-failure-batch",
        requestId,
      },
    });
    await database.processingOutboxMessage.create({
      data: {
        jobId: job.id,
        publishedAt: NOW,
        queueMessageId: "credit-failure-delivery",
      },
    });
    const message = WorkerMessageSchema.parse({
      version: 1,
      type: "PROCESS_IMAGE",
      jobId: job.id,
      batchId: job.batchIdempotencyKey,
      requestId,
      enqueuedAt: NOW.toISOString(),
    });
    const event = {
      Records: [
        { messageId: "credit-failure-delivery", body: JSON.stringify(message) },
      ],
    };
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        Response.json(
          {
            errors: [
              {
                code: "insufficient_credits",
                title: "Insufficient credits",
                detail: "secret should never be logged",
              },
            ],
          },
          {
            status: 402,
            headers: { "x-request-id": "provider-credit-failure" },
          },
        ),
      ),
    );
    const put = vi.fn(() => Promise.resolve());
    const storage: ProcessingObjectStoragePort = {
      getRequired: () =>
        Promise.resolve({ bytes, contentType: "image/jpeg", metadata: {} }),
      getOptional: () => Promise.resolve(null),
      put,
    };
    const provider = new RemoveBgProvider(
      {
        apiKey: "secret-provider-key",
        maximumOutputBytes: 1024,
        timeoutMilliseconds: 5000,
      },
      fetcher,
    );
    const executor = new ProcessingJobExecutor(storage, provider, {
      maximumInputBytes: 1024 * 1024,
      maximumPixels: 10000,
      previewMaximumWidth: 60,
    });
    const worker = new ProcessingWorker(
      new PrismaProcessingWorkerRepository(database),
      executor,
      {
        claimTtlMilliseconds: 30000,
        retryBaseMilliseconds: 1000,
        retryMaximumMilliseconds: 60000,
      },
      () => NOW,
    );
    const log = vi.spyOn(logger, "log");

    expect(await handleProcessingQueueEvent(event, worker)).toEqual({
      batchItemFailures: [],
    });
    expect(await handleProcessingQueueEvent(event, worker)).toEqual({
      batchItemFailures: [],
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(put).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(
      "error",
      "remove_bg_failed",
      expect.objectContaining({
        statusCode: 402,
        errorCode: "REMOVE_BG_PAYMENT_REQUIRED",
      }),
    );
    const failed = await database.processingJob.findUniqueOrThrow({
      where: { id: job.id },
      include: {
        attempts: true,
        vehicle: true,
        imageAsset: true,
        outboxMessage: true,
      },
    });
    expect(failed).toMatchObject({
      status: "FAILED",
      errorCode: "PROVIDER_PAYMENT_REQUIRED",
      attemptCount: 1,
      nextAttemptAt: null,
      vehicle: { status: "PARTIALLY_FAILED" },
      imageAsset: { status: "UPLOADED" },
    });
    expect(failed.attempts).toHaveLength(1);
    expect(failed.attempts[0]).toMatchObject({
      status: "FAILED",
      retryable: false,
      errorMessage:
        "remove.bg has insufficient credits (HTTP 402 Payment Required).",
    });
    expect(failed.outboxMessage?.publishedAt).not.toBeNull();
    const pending = await new PrismaProcessingOutboxRepository(
      database,
    ).claimPendingOutbox({
      claimToken: randomUUID(),
      claimExpiresAt: new Date(NOW.getTime() + 30000),
      limit: 10,
      now: NOW,
      jobIds: [job.id],
    });
    expect(pending).toHaveLength(0);
    expect(
      await database.usageEvent.count({
        where: { userId: owner.id, type: "BACKGROUND_REMOVAL_COMPLETED" },
      }),
    ).toBe(0);
    const statuses = await new ProcessingStatusService(
      new PrismaProcessingJobStatusRepository(database),
    ).getStatuses(owner.id, { ids: [job.id] });
    expect(statuses).toMatchObject({
      ok: true,
      response: {
        jobs: [
          {
            state: "FAILED",
            retryable: false,
          },
        ],
      },
    });
    expect(JSON.stringify(statuses)).not.toContain("Insufficient credits");
    expect(JSON.stringify(statuses)).not.toContain("secret");
  });
});
