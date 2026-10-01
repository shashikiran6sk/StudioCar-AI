import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { ProcessingOptionsSchema } from "../../../../packages/contracts/src/processing";
import { WorkerMessageSchema } from "../../../../packages/contracts/src/worker";
import { createDatabaseClient } from "../../../../packages/database-runtime/src/client";
import { PrismaProcessingWorkerRepository } from "../../../../packages/database-runtime/src/repositories/processing-worker-repository";
import { ProcessingWorker } from "../../../../packages/processing/src/processing-worker";
import { logger } from "../../../../packages/observability/src/structured-logger";
import { PrismaProcessingJobStatusRepository } from "../../../../apps/web/src/server/db/repositories/processing-job-status-repository";
import { PrismaProcessingOutboxRepository } from "../../../../apps/web/src/server/db/repositories/processing-outbox-repository";
import { ProcessingStatusService } from "../../../../apps/web/src/server/jobs/processing-status-service";
import { FileStudioBackgroundSource } from "../../../../workers/image-processing/src/execution/file-studio-background-source";
import { ProcessingJobExecutor } from "../../../../workers/image-processing/src/execution/processing-job-executor";
import { handleProcessingQueueEvent } from "../../../../workers/image-processing/src/handle-processing-queue-event";
import { LeonardoProvider } from "../../../../workers/image-processing/src/providers/leonardo-provider";
import type { ProcessingObjectStoragePort } from "../../../../workers/image-processing/src/storage/processing-object-storage.types";
import {
  createCutout,
  encodeCutout,
} from "../../../unit/workers/image-processing/test-support/create-cutout";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const EMAIL_DOMAIN = "leonardo-lifecycle.integration.studiocar.test";
const NOW = new Date("2099-09-20T00:00:00.000Z");
const API_KEY = "leonardo-secret-api-key";
const SIGNATURE = "presigned-source-signature";
const RESULT_TOKEN = "temporary-result-token";
const GENERATION_ID = "generation-lifecycle-1";
const RESULT_URL = `https://cdn.leonardo.ai/users/ephemeral/${GENERATION_ID}.webp?token=${RESULT_TOKEN}`;
const BACKGROUND_DIRECTORY = path.resolve(
  import.meta.dirname,
  "../../../../workers/image-processing/assets/backgrounds",
);

interface StoredObject {
  bytes: Uint8Array;
  contentType: string;
  metadata: Record<string, string>;
}

/** JSON text of database rows and log calls, which may hold BigInt sizes. */
function serialize(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) =>
    typeof item === "bigint" ? item.toString() : item,
  );
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * The full queue path for one image against real PostgreSQL: SQS event →
 * worker claim → executor → Leonardo adapter (HTTP mocked at `fetch`) →
 * compositor → storage → atomic completion or classified failure.
 */
databaseDescribe("Leonardo processing lifecycle against PostgreSQL", () => {
  let database: ReturnType<typeof createDatabaseClient>;

  beforeAll(() => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required.");
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  afterAll(async () => {
    await database.user.deleteMany({
      where: { primaryEmail: { endsWith: `@${EMAIL_DOMAIN}` } },
    });
    await database.$disconnect();
  });

  async function arrange(name: string) {
    const source = await sharp({
      create: { background: "#135579", channels: 3, height: 400, width: 640 },
    })
      .jpeg()
      .toBuffer();
    const email = `${name}@${EMAIL_DOMAIN}`;
    await database.user.deleteMany({ where: { primaryEmail: email } });
    const owner = await database.user.create({ data: { primaryEmail: email } });
    const vehicle = await database.vehicle.create({
      data: { name: `${name} vehicle`, status: "PROCESSING", userId: owner.id },
    });
    const assetId = randomUUID();
    const originalObjectKey = `users/${owner.id}/vehicles/${vehicle.id}/assets/${assetId}/original/source.jpg`;
    await database.imageAsset.create({
      data: {
        checksumSha256: sha256(source),
        id: assetId,
        mimeType: "image/jpeg",
        originalFilename: "source.jpg",
        originalObjectKey,
        sizeBytes: source.byteLength,
        status: "UPLOADED",
        uploadExpiresAt: NOW,
        userId: owner.id,
        vehicleId: vehicle.id,
      },
    });
    const requestId = randomUUID();
    const job = await database.processingJob.create({
      data: {
        batchIdempotencyKey: `leonardo-lifecycle-${name}-batch`,
        idempotencyKey: `leonardo-lifecycle-${name}-image`,
        imageAssetId: assetId,
        options: ProcessingOptionsSchema.parse({}),
        provider: "LEONARDO",
        requestId,
        status: "QUEUED",
        userId: owner.id,
        vehicleId: vehicle.id,
      },
    });
    await database.processingOutboxMessage.create({
      data: { jobId: job.id, publishedAt: NOW, queueMessageId: `${name}-delivery` },
    });
    const message = WorkerMessageSchema.parse({
      batchId: job.batchIdempotencyKey,
      enqueuedAt: NOW.toISOString(),
      jobId: job.id,
      requestId,
      type: "PROCESS_IMAGE",
      version: 1,
    });
    const event = {
      Records: [{ body: JSON.stringify(message), messageId: `${name}-delivery` }],
    };
    const objects = new Map<string, StoredObject>([
      [originalObjectKey, { bytes: source, contentType: "image/jpeg", metadata: {} }],
    ]);
    const storage: ProcessingObjectStoragePort = {
      getOptional: (key) => Promise.resolve(objects.get(key) ?? null),
      getRequired: (key) => {
        const stored = objects.get(key);
        return stored
          ? Promise.resolve(stored)
          : Promise.reject(new Error("Object not found."));
      },
      put: (object) => {
        objects.set(object.key, {
          bytes: object.bytes,
          contentType: object.contentType,
          metadata: object.metadata,
        });
        return Promise.resolve();
      },
    };
    const resolveSourceUrl = vi.fn((key: string) =>
      Promise.resolve(
        `https://studiocar-prod.s3.amazonaws.com/${key}?X-Amz-Signature=${SIGNATURE}`,
      ),
    );
    const run = (fetcher: typeof fetch) => {
      const provider = new LeonardoProvider(
        {
          apiKey: API_KEY,
          maximumOutputBytes: 8 * 1024 * 1024,
          maximumPixels: 4_000_000,
          timeoutMilliseconds: 5_000,
        },
        resolveSourceUrl,
        fetcher,
      );
      const executor = new ProcessingJobExecutor(
        storage,
        provider,
        new FileStudioBackgroundSource(BACKGROUND_DIRECTORY),
        { maximumInputBytes: 1024 * 1024, maximumPixels: 4_000_000, previewMaximumWidth: 320 },
      );
      const worker = new ProcessingWorker(
        new PrismaProcessingWorkerRepository(database),
        executor,
        {
          claimTtlMilliseconds: 180_000,
          retryBaseMilliseconds: 1_000,
          retryMaximumMilliseconds: 300_000,
        },
        () => NOW,
      );
      return handleProcessingQueueEvent(event, worker);
    };
    return { job, objects, owner, run };
  }

  function requestBody(fetcher: ReturnType<typeof vi.fn<typeof fetch>>): unknown {
    const body = fetcher.mock.calls[0]?.[1]?.body;
    if (typeof body !== "string") throw new Error("No Leonardo request was sent.");
    const parsed: unknown = JSON.parse(body);
    return parsed;
  }

  it("composes a studio image, stores it privately and charges usage exactly once", async () => {
    const { job, objects, owner, run } = await arrange("completed");
    const cutout = await encodeCutout(createCutout());
    const fetcher = vi.fn<typeof fetch>((input) =>
      Promise.resolve(
        String(input) === RESULT_URL
          ? new Response(new Uint8Array(cutout), {
              headers: { "content-type": "image/webp" },
            })
          : // The Sync API's real shape: the generation inside `generateSync`.
            Response.json({
              generateSync: {
                blockedCount: 0,
                cost: { amount: "0.0425", unit: "DOLLARS" },
                id: GENERATION_ID,
                results: [
                  {
                    contentType: "image/webp",
                    dataB64: null,
                    height: 400,
                    url: RESULT_URL,
                    width: 640,
                  },
                ],
              },
            }),
      ),
    );
    const log = vi.spyOn(logger, "log");

    expect(await run(fetcher)).toEqual({ batchItemFailures: [] });
    // A duplicate SQS delivery of a completed job is acknowledged untouched.
    expect(await run(fetcher)).toEqual({ batchItemFailures: [] });

    expect(fetcher).toHaveBeenCalledTimes(2);
    // A free account (no subscription) receives Leonardo's preview size.
    expect(requestBody(fetcher)).toMatchObject({
      ephemeral: true,
      model: "remove-bg",
      parameters: { shadow_type: "car", size: "preview", type: "car" },
      public: false,
    });

    const completed = await database.processingJob.findUniqueOrThrow({
      include: { attempts: true, imageAsset: true, processedAsset: true },
      where: { id: job.id },
    });
    expect(completed).toMatchObject({
      attemptCount: 1,
      // The original stays available for further treatments.
      imageAsset: { status: "UPLOADED" },
      providerRequestId: GENERATION_ID,
      status: "COMPLETED",
    });
    expect(completed.attempts).toEqual([
      expect.objectContaining({ provider: "LEONARDO", status: "SUCCEEDED" }),
    ]);
    const output = completed.processedAsset;
    if (!output) throw new Error("No processed asset was recorded.");
    expect(output).toMatchObject({ mimeType: "image/webp", outputFormat: "WEBP" });
    const stored = objects.get(output.objectKey);
    if (!stored) throw new Error("The output was not stored.");
    expect(sha256(stored.bytes)).toBe(output.checksumSha256);
    expect((await sharp(stored.bytes).metadata()).format).toBe("webp");
    expect(objects.has(output.previewObjectKey ?? "")).toBe(true);
    expect([...objects.keys()].some((key) => key.endsWith("provider-cutout.webp"))).toBe(true);

    expect(
      await database.usageEvent.count({
        where: { type: "BACKGROUND_REMOVAL_COMPLETED", userId: owner.id },
      }),
    ).toBe(1);
    const persisted = serialize(completed);
    const logged = serialize(log.mock.calls);
    for (const secret of [API_KEY, SIGNATURE, RESULT_TOKEN]) {
      expect(persisted).not.toContain(secret);
      expect(logged).not.toContain(secret);
    }
  });

  it("fails a payment refusal once, acknowledges SQS, preserves the original and never republishes", async () => {
    const { job, objects, owner, run } = await arrange("payment-required");
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        Response.json(
          { error: "insufficient credits", detail: `secret ${API_KEY}` },
          { status: 402 },
        ),
      ),
    );
    const log = vi.spyOn(logger, "log");

    expect(await run(fetcher)).toEqual({ batchItemFailures: [] });
    expect(await run(fetcher)).toEqual({ batchItemFailures: [] });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(objects.size).toBe(1);
    expect(log).toHaveBeenCalledWith(
      "error",
      "provider_request_failed",
      expect.objectContaining({
        errorCode: "PROVIDER_PAYMENT_REQUIRED",
        provider: "leonardo",
        statusCode: 402,
      }),
    );

    const failed = await database.processingJob.findUniqueOrThrow({
      include: { attempts: true, imageAsset: true, outboxMessage: true, vehicle: true },
      where: { id: job.id },
    });
    expect(failed).toMatchObject({
      attemptCount: 1,
      errorCode: "PROVIDER_PAYMENT_REQUIRED",
      imageAsset: { status: "UPLOADED" },
      nextAttemptAt: null,
      status: "FAILED",
      vehicle: { status: "PARTIALLY_FAILED" },
    });
    expect(failed.attempts).toEqual([
      expect.objectContaining({ provider: "LEONARDO", retryable: false, status: "FAILED" }),
    ]);
    expect(failed.outboxMessage?.publishedAt).not.toBeNull();
    expect(
      await new PrismaProcessingOutboxRepository(database).claimPendingOutbox({
        claimExpiresAt: new Date(NOW.getTime() + 30_000),
        claimToken: randomUUID(),
        jobIds: [job.id],
        limit: 10,
        now: NOW,
      }),
    ).toHaveLength(0);
    expect(
      await database.usageEvent.count({
        where: { type: "BACKGROUND_REMOVAL_COMPLETED", userId: owner.id },
      }),
    ).toBe(0);

    const statuses = await new ProcessingStatusService(
      new PrismaProcessingJobStatusRepository(database),
    ).getStatuses(owner.id, { ids: [job.id] });
    expect(statuses).toMatchObject({
      ok: true,
      response: { jobs: [{ retryable: false, state: "FAILED" }] },
    });
    const visible = serialize(statuses);
    expect(visible).not.toMatch(/leonardo|insufficient|402|secret/i);
  });

  it("fails a paid but unusable response once, so a retry never pays again", async () => {
    const { job, objects, owner, run } = await arrange("unusable-result");
    // A 200 is charged by Leonardo even when its body cannot be used.
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(Response.json({ generateSync: { id: GENERATION_ID, results: "x" } })),
    );
    const log = vi.spyOn(logger, "log");

    expect(await run(fetcher)).toEqual({ batchItemFailures: [] });
    expect(await run(fetcher)).toEqual({ batchItemFailures: [] });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(objects.size).toBe(1);
    expect(log).toHaveBeenCalledWith(
      "error",
      "provider_request_failed",
      expect.objectContaining({
        errorCode: "PROVIDER_UNUSABLE_RESULT",
        responseIssueCode: "invalid_type",
        responseIssuePath: "results",
      }),
    );

    const failed = await database.processingJob.findUniqueOrThrow({
      include: { attempts: true, imageAsset: true, outboxMessage: true },
      where: { id: job.id },
    });
    expect(failed).toMatchObject({
      attemptCount: 1,
      errorCode: "PROVIDER_UNUSABLE_RESULT",
      // The person's photo is not blamed for the provider's response.
      imageAsset: { status: "UPLOADED" },
      nextAttemptAt: null,
      status: "FAILED",
    });
    expect(failed.attempts).toEqual([
      expect.objectContaining({ retryable: false, status: "FAILED" }),
    ]);
    expect(failed.outboxMessage?.publishedAt).not.toBeNull();
    expect(
      await database.usageEvent.count({ where: { userId: owner.id } }),
    ).toBe(0);
    const statuses = await new ProcessingStatusService(
      new PrismaProcessingJobStatusRepository(database),
    ).getStatuses(owner.id, { ids: [job.id] });
    expect(statuses).toMatchObject({
      ok: true,
      response: { jobs: [{ retryable: false, state: "FAILED" }] },
    });
  });

  it("reschedules a rate-limited request durably, no sooner than Leonardo's Retry-After", async () => {
    const { job, objects, owner, run } = await arrange("rate-limited");
    const fetcher = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        new Response(null, { headers: { "retry-after": "120" }, status: 429 }),
      ),
    );

    // The retry is durable (the outbox republishes later), so SQS is
    // acknowledged now rather than redelivered on its own schedule.
    expect(await run(fetcher)).toEqual({ batchItemFailures: [] });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(objects.size).toBe(1);

    const retrying = await database.processingJob.findUniqueOrThrow({
      include: { attempts: true, outboxMessage: true },
      where: { id: job.id },
    });
    expect(retrying).toMatchObject({
      errorCode: "PROVIDER_RATE_LIMITED",
      status: "RETRYING",
    });
    expect(retrying.nextAttemptAt?.getTime()).toBe(NOW.getTime() + 120_000);
    expect(retrying.attempts).toEqual([
      expect.objectContaining({ retryable: true, status: "FAILED" }),
    ]);
    expect(retrying.outboxMessage).toMatchObject({ publishedAt: null });
    expect(retrying.outboxMessage?.nextAttemptAt?.getTime()).toBe(
      NOW.getTime() + 120_000,
    );
    expect(
      await database.usageEvent.count({ where: { userId: owner.id } }),
    ).toBe(0);
  });
});
