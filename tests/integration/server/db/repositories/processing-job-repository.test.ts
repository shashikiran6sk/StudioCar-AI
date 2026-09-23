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
    const options = ProcessingOptionsSchema.parse({
      backgroundId: "GREY_STUDIO",
      floorId: "GREY_TURNTABLE",
    });
    const request = {
      vehicleId: vehicle.id,
      assetIds,
      options,
    };
    const command = {
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
    // Every job stores the background and its floor exactly as requested.
    const storedOptions = await database.processingJob.findMany({
      where: { vehicleId: vehicle.id },
      select: { options: true },
    });
    for (const stored of storedOptions) {
      expect(ProcessingOptionsSchema.parse(stored.options)).toEqual(options);
    }
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
    const options = ProcessingOptionsSchema.parse({
      backgroundId: "PREMIUM_WHITE",
      floorId: "WHITE_STUDIO",
    });

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
    const options = ProcessingOptionsSchema.parse({
      backgroundId: "PREMIUM_WHITE",
      floorId: "WHITE_STUDIO",
    });
    return {
      allowance,
      userId: owner.id,
      vehicleId: vehicle.id,
      batchIdempotencyKey: batchKey,
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
        command(owner, vehicle, assetIds, freeAllowance, "limits-batch-too-big"),
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
