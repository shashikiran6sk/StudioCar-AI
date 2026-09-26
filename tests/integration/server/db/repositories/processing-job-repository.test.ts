import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { ProcessingOptionsSchema } from "../../../../../packages/contracts/src/processing";
import { createDatabaseClient } from "../../../../../packages/database-runtime/src/client";
import { PrismaProcessingJobRepository } from "../../../../../apps/web/src/server/db/repositories/processing-job-repository";
import { ProcessingProvider } from "../../../../../packages/database-runtime/generated/prisma/client";
import { createProcessingBatchRequestHash } from "../../../../../packages/processing/src/create-processing-batch-request-hash";
import { createProcessingJobIdempotencyKey } from "../../../../../packages/processing/src/create-processing-job-idempotency-key";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const ownerEmail = "processing-owner@integration.studiocar.test";
const otherEmail = "processing-other@integration.studiocar.test";

databaseDescribe("PrismaProcessingJobRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let repository: PrismaProcessingJobRepository;

  beforeAll(() => {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for integration tests.");
    }
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    repository = new PrismaProcessingJobRepository(database);
  });

  afterEach(async () => {
    await database.user.deleteMany({
      where: { primaryEmail: { in: [ownerEmail, otherEmail] } },
    });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("atomically reserves one owned job per uploaded asset and replays the batch", async () => {
    const [owner, other] = await Promise.all([
      database.user.create({ data: { primaryEmail: ownerEmail } }),
      database.user.create({ data: { primaryEmail: otherEmail } }),
    ]);
    const vehicle = await database.vehicle.create({
      data: { userId: owner.id, name: "Processing test vehicle" },
    });
    const assetIds = [randomUUID(), randomUUID()];
    await Promise.all(
      assetIds.map((assetId, displayOrder) =>
        database.imageAsset.create({
          data: {
            id: assetId,
            userId: owner.id,
            vehicleId: vehicle.id,
            status: "UPLOADED",
            originalObjectKey: `users/${owner.id}/vehicles/${vehicle.id}/assets/${assetId}/original/source.jpg`,
            originalFilename: `source-${String(displayOrder)}.jpg`,
            mimeType: "image/jpeg",
            sizeBytes: 1024,
            displayOrder,
            uploadExpiresAt: new Date("2026-09-19T12:05:00.000Z"),
            uploadedAt: new Date("2026-09-19T12:01:00.000Z"),
          },
        }),
      ),
    );
    const batchIdempotencyKey = "processing-integration-batch-1";
    const options = ProcessingOptionsSchema.parse({});
    const request = {
      vehicleId: vehicle.id,
      assetIds,
      options,
    };
    const command = {
      requestId: "7e38d07b-c3c3-4ce0-9a50-91055e9bf3de",
      allowance: {
        imageCapacity: 100,
        maxImagesPerBatch: 20,
        allowanceBillingPeriodKey: null,
      },
      userId: owner.id,
      vehicleId: vehicle.id,
      batchIdempotencyKey,
      batchLabel: null,
      batchRequestHash: createProcessingBatchRequestHash(request),
      provider: ProcessingProvider.REMOVEBG,
      usageBillingPeriodKey: "2026-09",
      usageIdempotencyKey: "usage:upload-session:processing-integration-batch-1",
      options,
      jobs: assetIds.map((assetId, displayOrder) => ({
        assetId,
        displayOrder,
        idempotencyKey: createProcessingJobIdempotencyKey(
          batchIdempotencyKey,
          assetId,
        ),
      })),
    } satisfies Parameters<
      PrismaProcessingJobRepository["reserveBatchOwned"]
    >[0];

    const [first, replay] = await Promise.all([
      repository.reserveBatchOwned(command),
      repository.reserveBatchOwned(command),
    ]);

    expect([first.kind, replay.kind].sort()).toEqual(["CREATED", "EXISTING"]);
    await repository.reserveBatchOwned({ ...command, requestId: randomUUID() });
    expect(
      await database.processingJob.findMany({
        where: { vehicleId: vehicle.id },
        select: { requestId: true },
      }),
    ).toEqual([
      { requestId: command.requestId },
      { requestId: command.requestId },
    ]);
    await expect(
      repository.reserveBatchOwned({
        ...command,
        batchRequestHash: "f".repeat(64),
      }),
    ).resolves.toEqual({ kind: "IDEMPOTENCY_CONFLICT" });
    await expect(
      repository.reserveBatchOwned({ ...command, userId: other.id }),
    ).resolves.toEqual({ kind: "VEHICLE_NOT_FOUND" });
    await expect(
      database.vehicle.findUnique({
        where: { id: vehicle.id },
        select: { status: true },
      }),
    ).resolves.toEqual({ status: "PROCESSING" });
    await expect(
      database.processingJob.count({ where: { vehicleId: vehicle.id } }),
    ).resolves.toBe(2);
    await expect(
      database.processingOutboxMessage.count({
        where: { job: { vehicleId: vehicle.id } },
      }),
    ).resolves.toBe(2);
    await expect(
      database.usageEvent.findMany({
        where: { userId: owner.id },
        select: { billingPeriodKey: true, quantity: true, type: true },
      }),
    ).resolves.toEqual([
      {
        billingPeriodKey: "2026-09",
        quantity: 1,
        type: "VEHICLE_PROCESSING_BATCH_CREATED",
      },
    ]);
  });

  it("leaves the draft unchanged when any requested asset is not uploaded", async () => {
    const owner = await database.user.create({
      data: { primaryEmail: ownerEmail },
    });
    const vehicle = await database.vehicle.create({
      data: { userId: owner.id, name: "Incomplete upload vehicle" },
    });
    const missingAssetId = randomUUID();
    const options = ProcessingOptionsSchema.parse({});

    await expect(
      repository.reserveBatchOwned({
        allowance: {
          imageCapacity: 100,
          maxImagesPerBatch: 20,
          allowanceBillingPeriodKey: null,
        },
        userId: owner.id,
        vehicleId: vehicle.id,
        batchIdempotencyKey: "processing-integration-batch-2",
        batchLabel: null,
        batchRequestHash: "a".repeat(64),
        provider: ProcessingProvider.REMOVEBG,
        usageBillingPeriodKey: "2026-09",
        usageIdempotencyKey: "usage:upload-session:processing-integration-batch-2",
        options,
        jobs: [
          {
            assetId: missingAssetId,
            displayOrder: 0,
            idempotencyKey: createProcessingJobIdempotencyKey(
              "processing-integration-batch-2",
              missingAssetId,
            ),
          },
        ],
      }),
    ).resolves.toEqual({ kind: "ASSETS_NOT_READY" });
    await expect(
      database.vehicle.findUnique({
        where: { id: vehicle.id },
        select: { status: true },
      }),
    ).resolves.toEqual({ status: "DRAFT" });
  });
});

databaseDescribe("PrismaProcessingJobRepository plan limits", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let repository: PrismaProcessingJobRepository;
  const limitOwnerEmail = "processing-limits@integration.studiocar.test";

  beforeAll(() => {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for integration tests.");
    }
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    repository = new PrismaProcessingJobRepository(database);
  });

  afterEach(async () => {
    await database.user.deleteMany({
      where: { primaryEmail: limitOwnerEmail },
    });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  async function seedVehicle(imageCount: number) {
    const owner = await database.user.create({
      data: { primaryEmail: limitOwnerEmail },
    });
    const vehicle = await database.vehicle.create({
      data: { userId: owner.id, name: "Allowance test vehicle" },
    });
    const assetIds = Array.from({ length: imageCount }, () => randomUUID());
    await Promise.all(
      assetIds.map((assetId, displayOrder) =>
        database.imageAsset.create({
          data: {
            id: assetId,
            userId: owner.id,
            vehicleId: vehicle.id,
            status: "UPLOADED",
            originalObjectKey: `users/${owner.id}/vehicles/${vehicle.id}/assets/${assetId}/original/source.jpg`,
            originalFilename: `source-${String(displayOrder)}.jpg`,
            mimeType: "image/jpeg",
            sizeBytes: 1024,
            displayOrder,
            uploadExpiresAt: new Date("2026-09-19T12:05:00.000Z"),
            uploadedAt: new Date("2026-09-19T12:01:00.000Z"),
          },
        }),
      ),
    );
    return { owner, vehicle, assetIds };
  }

  function command(
    owner: { id: string },
    vehicle: { id: string },
    assetIds: string[],
    allowance: {
      imageCapacity: number;
      maxImagesPerBatch: number;
      allowanceBillingPeriodKey: string | null;
    },
    batchKey: string,
  ) {
    const options = ProcessingOptionsSchema.parse({});
    return {
      allowance,
      userId: owner.id,
      vehicleId: vehicle.id,
      batchIdempotencyKey: batchKey,
      batchLabel: null,
      batchRequestHash: createProcessingBatchRequestHash({
        vehicleId: vehicle.id,
        assetIds,
        options,
      }),
      provider: ProcessingProvider.REMOVEBG,
      usageBillingPeriodKey: "2026-09",
      usageIdempotencyKey: `usage:upload-session:${batchKey}`,
      options,
      jobs: assetIds.map((assetId, displayOrder) => ({
        assetId,
        displayOrder,
        idempotencyKey: createProcessingJobIdempotencyKey(batchKey, assetId),
      })),
    };
  }

  const freeAllowance = {
    imageCapacity: 15,
    maxImagesPerBatch: 5,
    allowanceBillingPeriodKey: null,
  };

  it("refuses a batch larger than the plan's per-batch limit", async () => {
    const { owner, vehicle, assetIds } = await seedVehicle(6);

    await expect(
      repository.reserveBatchOwned(
        command(
          owner,
          vehicle,
          assetIds,
          freeAllowance,
          "limits-batch-too-big",
        ),
      ),
    ).resolves.toEqual({ kind: "BATCH_LIMIT_EXCEEDED", maxImagesPerBatch: 5 });

    // Nothing was reserved, so the vehicle is still a draft.
    const after = await database.vehicle.findUnique({
      where: { id: vehicle.id },
      select: { status: true },
    });
    expect(after?.status).toBe("DRAFT");
    expect(
      await database.processingJob.count({ where: { userId: owner.id } }),
    ).toBe(0);
  });

  it("accepts a batch exactly at the per-batch limit", async () => {
    const { owner, vehicle, assetIds } = await seedVehicle(5);

    await expect(
      repository.reserveBatchOwned(
        command(owner, vehicle, assetIds, freeAllowance, "limits-batch-exact"),
      ),
    ).resolves.toMatchObject({ kind: "CREATED" });
  });

  it("counts reserved but unfinished work against the allowance", async () => {
    const { owner, vehicle, assetIds } = await seedVehicle(5);
    await repository.reserveBatchOwned(
      command(owner, vehicle, assetIds, freeAllowance, "limits-in-flight-1"),
    );

    // Five images are in flight and none has completed, so an allowance of five
    // must already be spent.
    const second = await seedVehicleFor(owner.id, 1);
    await expect(
      repository.reserveBatchOwned(
        command(
          owner,
          second.vehicle,
          second.assetIds,
          { ...freeAllowance, imageCapacity: 5 },
          "limits-in-flight-2",
        ),
      ),
    ).resolves.toEqual({
      kind: "ALLOWANCE_EXHAUSTED",
      imageCapacity: 5,
      imagesRemaining: 0,
    });
  });

  it("does not charge a failed job against the allowance", async () => {
    const { owner, vehicle, assetIds } = await seedVehicle(2);
    await repository.reserveBatchOwned(
      command(owner, vehicle, assetIds, freeAllowance, "limits-failed-1"),
    );
    await database.processingJob.updateMany({
      where: { userId: owner.id },
      data: { status: "FAILED", failedAt: new Date() },
    });

    const second = await seedVehicleFor(owner.id, 2);
    await expect(
      repository.reserveBatchOwned(
        command(
          owner,
          second.vehicle,
          second.assetIds,
          { ...freeAllowance, imageCapacity: 2 },
          "limits-failed-2",
        ),
      ),
    ).resolves.toMatchObject({ kind: "CREATED" });
  });

  async function seedVehicleFor(userId: string, imageCount: number) {
    const vehicle = await database.vehicle.create({
      data: { userId, name: "Second allowance vehicle" },
    });
    const assetIds = Array.from({ length: imageCount }, () => randomUUID());
    await Promise.all(
      assetIds.map((assetId, displayOrder) =>
        database.imageAsset.create({
          data: {
            id: assetId,
            userId,
            vehicleId: vehicle.id,
            status: "UPLOADED",
            originalObjectKey: `users/${userId}/vehicles/${vehicle.id}/assets/${assetId}/original/source.jpg`,
            originalFilename: `source-${String(displayOrder)}.jpg`,
            mimeType: "image/jpeg",
            sizeBytes: 1024,
            displayOrder,
            uploadExpiresAt: new Date("2026-09-19T12:05:00.000Z"),
            uploadedAt: new Date("2026-09-19T12:01:00.000Z"),
          },
        }),
      ),
    );
    return { vehicle, assetIds };
  }
});

databaseDescribe("PrismaProcessingJobRepository studio versions", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let repository: PrismaProcessingJobRepository;
  const versionOwnerEmail = "processing-versions@integration.studiocar.test";
  const allowance = {
    imageCapacity: 100,
    maxImagesPerBatch: 20,
    allowanceBillingPeriodKey: null,
  };

  beforeAll(() => {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for integration tests.");
    }
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    repository = new PrismaProcessingJobRepository(database);
  });

  afterEach(async () => {
    await database.user.deleteMany({
      where: { primaryEmail: versionOwnerEmail },
    });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  async function createAsset(
    userId: string,
    vehicleId: string,
    status: "UPLOADED" | "INVALID" = "UPLOADED",
  ) {
    const id = randomUUID();
    await database.imageAsset.create({
      data: {
        id,
        mimeType: "image/jpeg",
        originalFilename: `${id}.jpg`,
        originalObjectKey: `users/${userId}/vehicles/${vehicleId}/assets/${id}/original/source.jpg`,
        sizeBytes: 1024,
        status,
        uploadExpiresAt: new Date("2026-09-19T12:05:00.000Z"),
        userId,
        vehicleId,
      },
    });
    return id;
  }

  /** A vehicle whose first batch finished: one completed image with output. */
  async function seedFinishedVehicle(
    status: "READY" | "PARTIALLY_FAILED" = "READY",
  ) {
    const owner = await database.user.create({
      data: { primaryEmail: versionOwnerEmail },
    });
    const vehicle = await database.vehicle.create({
      data: { name: "2024 BMW X1", status, userId: owner.id },
    });
    const assetId = await createAsset(owner.id, vehicle.id);
    const completedAt = new Date("2026-09-19T12:10:00.000Z");
    const job = await database.processingJob.create({
      data: {
        batchIdempotencyKey: "versions-white-batch",
        completedAt,
        idempotencyKey: "versions-white-job",
        imageAssetId: assetId,
        options: ProcessingOptionsSchema.parse({}),
        provider: "REMOVEBG",
        status: "COMPLETED",
        userId: owner.id,
        vehicleId: vehicle.id,
      },
    });
    const output = await database.processedAsset.create({
      data: {
        height: 720,
        jobId: job.id,
        mimeType: "image/webp",
        objectKey: `users/${owner.id}/vehicles/${vehicle.id}/white.webp`,
        outputFormat: "WEBP",
        previewObjectKey: `users/${owner.id}/vehicles/${vehicle.id}/white-preview.webp`,
        sizeBytes: 2048,
        userId: owner.id,
        vehicleId: vehicle.id,
        width: 1280,
      },
    });
    return { assetId, completedAt, job, output, owner, vehicle };
  }

  function batch(
    userId: string,
    vehicleId: string,
    assetIds: string[],
    batchKey: string,
    background: "DARK_STUDIO" | "PREMIUM_WHITE" = "DARK_STUDIO",
  ) {
    const options = ProcessingOptionsSchema.parse({ background });
    return {
      allowance,
      batchIdempotencyKey: batchKey,
      batchLabel: null,
      batchRequestHash: createProcessingBatchRequestHash({
        assetIds,
        options,
        vehicleId,
      }),
      jobs: assetIds.map((assetId, displayOrder) => ({
        assetId,
        displayOrder,
        idempotencyKey: createProcessingJobIdempotencyKey(batchKey, assetId),
      })),
      options,
      provider: ProcessingProvider.REMOVEBG,
      usageBillingPeriodKey: "2026-09",
      usageIdempotencyKey: `usage:upload-session:${batchKey}`,
      userId,
      vehicleId,
    };
  }

  it("creates a new version for a finished vehicle and leaves the earlier one untouched", async () => {
    const seeded = await seedFinishedVehicle();

    const result = await repository.reserveBatchOwned(
      batch(
        seeded.owner.id,
        seeded.vehicle.id,
        [seeded.assetId],
        "versions-dark-batch",
      ),
    );

    expect(result.kind).toBe("CREATED");
    await expect(
      database.vehicle.findUnique({
        where: { id: seeded.vehicle.id },
        select: { status: true },
      }),
    ).resolves.toEqual({ status: "PROCESSING" });
    await expect(
      database.processingJob.findUnique({
        where: { id: seeded.job.id },
        select: { completedAt: true, status: true },
      }),
    ).resolves.toEqual({
      completedAt: seeded.completedAt,
      status: "COMPLETED",
    });
    await expect(
      database.processedAsset.findUnique({
        where: { id: seeded.output.id },
        select: { objectKey: true },
      }),
    ).resolves.toEqual({ objectKey: seeded.output.objectKey });
    await expect(
      database.processingJob.findMany({
        where: { vehicleId: seeded.vehicle.id },
        orderBy: { createdAt: "asc" },
        select: { batchIdempotencyKey: true, imageAssetId: true },
      }),
    ).resolves.toEqual([
      {
        batchIdempotencyKey: "versions-white-batch",
        imageAssetId: seeded.assetId,
      },
      {
        batchIdempotencyKey: "versions-dark-batch",
        imageAssetId: seeded.assetId,
      },
    ]);
    await expect(
      database.vehicle.count({ where: { userId: seeded.owner.id } }),
    ).resolves.toBe(1);
  });

  it("refuses another batch while one is running, and for an archived vehicle", async () => {
    const seeded = await seedFinishedVehicle();
    await repository.reserveBatchOwned(
      batch(
        seeded.owner.id,
        seeded.vehicle.id,
        [seeded.assetId],
        "versions-running-batch",
      ),
    );

    await expect(
      repository.reserveBatchOwned(
        batch(
          seeded.owner.id,
          seeded.vehicle.id,
          [seeded.assetId],
          "versions-second-batch",
          "PREMIUM_WHITE",
        ),
      ),
    ).resolves.toEqual({ kind: "VEHICLE_UNAVAILABLE" });

    await database.vehicle.update({
      where: { id: seeded.vehicle.id },
      data: { status: "ARCHIVED" },
    });
    await expect(
      repository.reserveBatchOwned(
        batch(
          seeded.owner.id,
          seeded.vehicle.id,
          [seeded.assetId],
          "versions-archived-batch",
        ),
      ),
    ).resolves.toEqual({ kind: "VEHICLE_UNAVAILABLE" });
  });

  it("creates one batch when differently keyed submissions race for a vehicle", async () => {
    const seeded = await seedFinishedVehicle();

    const results = await Promise.all(
      ["versions-race-a", "versions-race-b", "versions-race-c"].map((key) =>
        repository.reserveBatchOwned(
          batch(seeded.owner.id, seeded.vehicle.id, [seeded.assetId], key),
        ),
      ),
    );

    expect(results.filter((result) => result.kind === "CREATED")).toHaveLength(
      1,
    );
    expect(
      results.filter((result) => result.kind === "VEHICLE_UNAVAILABLE"),
    ).toHaveLength(2);
    await expect(
      database.processingJob.count({ where: { vehicleId: seeded.vehicle.id } }),
    ).resolves.toBe(2);
  });

  it("processes a replacement original and keeps the failed batch's history", async () => {
    const seeded = await seedFinishedVehicle("PARTIALLY_FAILED");
    const unreadable = await createAsset(
      seeded.owner.id,
      seeded.vehicle.id,
      "INVALID",
    );
    const failed = await database.processingJob.create({
      data: {
        batchIdempotencyKey: "versions-white-batch",
        errorCode: "INVALID_IMAGE",
        failedAt: new Date("2026-09-19T12:11:00.000Z"),
        idempotencyKey: "versions-failed-job",
        imageAssetId: unreadable,
        options: ProcessingOptionsSchema.parse({}),
        provider: "REMOVEBG",
        status: "FAILED",
        userId: seeded.owner.id,
        vehicleId: seeded.vehicle.id,
      },
    });
    const replacement = await createAsset(seeded.owner.id, seeded.vehicle.id);

    await expect(
      repository.reserveBatchOwned(
        batch(
          seeded.owner.id,
          seeded.vehicle.id,
          [unreadable],
          "versions-invalid-retry",
          "PREMIUM_WHITE",
        ),
      ),
    ).resolves.toEqual({ kind: "ASSETS_NOT_READY" });
    const result = await repository.reserveBatchOwned(
      batch(
        seeded.owner.id,
        seeded.vehicle.id,
        [replacement],
        "versions-replace-batch",
        "PREMIUM_WHITE",
      ),
    );

    expect(result).toMatchObject({
      jobs: [{ imageAssetId: replacement }],
      kind: "CREATED",
    });
    await expect(
      database.processingJob.findUnique({
        where: { id: failed.id },
        select: { errorCode: true, status: true },
      }),
    ).resolves.toEqual({ errorCode: "INVALID_IMAGE", status: "FAILED" });
  });
});
