import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../packages/database/src/client";
import { PrismaDashboardRepository } from "../../../../packages/database/src/repositories/dashboard-repository";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;

databaseDescribe("PrismaDashboardRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let repository: PrismaDashboardRepository;
  const ownerEmail = "dashboard-owner@integration.studiocar.test";
  const otherEmail = "dashboard-other@integration.studiocar.test";

  beforeAll(() => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required for integration tests.");
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    repository = new PrismaDashboardRepository(database);
  });

  afterEach(async () => {
    await database.user.deleteMany({
      where: { primaryEmail: { in: [ownerEmail, otherEmail] } },
    });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("derives dashboard metrics only from the owning tenant", async () => {
    const [owner, other] = await Promise.all([
      database.user.create({ data: { primaryEmail: ownerEmail } }),
      database.user.create({ data: { primaryEmail: otherEmail } }),
    ]);
    const [readyVehicle, processingVehicle, foreignVehicle] = await Promise.all([
      database.vehicle.create({
        data: { name: "Ready", status: "READY", userId: owner.id },
      }),
      database.vehicle.create({
        data: { name: "Processing", status: "PROCESSING", userId: owner.id },
      }),
      database.vehicle.create({
        data: { name: "Foreign", status: "READY", userId: other.id },
      }),
    ]);
    const [readyImage, processingImage, foreignImage] = await Promise.all([
      database.imageAsset.create({
        data: {
          mimeType: "image/jpeg",
          originalFilename: "ready.jpg",
          originalObjectKey: `users/${owner.id}/ready.jpg`,
          sizeBytes: 1_000,
          status: "UPLOADED",
          uploadExpiresAt: new Date("2026-09-20T12:00:00.000Z"),
          userId: owner.id,
          vehicleId: readyVehicle.id,
        },
      }),
      database.imageAsset.create({
        data: {
          mimeType: "image/jpeg",
          originalFilename: "processing.jpg",
          originalObjectKey: `users/${owner.id}/processing.jpg`,
          sizeBytes: 2_000,
          status: "UPLOADED",
          uploadExpiresAt: new Date("2026-09-20T12:00:00.000Z"),
          userId: owner.id,
          vehicleId: processingVehicle.id,
        },
      }),
      database.imageAsset.create({
        data: {
          mimeType: "image/jpeg",
          originalFilename: "foreign.jpg",
          originalObjectKey: `users/${other.id}/foreign.jpg`,
          sizeBytes: 9_000,
          status: "UPLOADED",
          uploadExpiresAt: new Date("2026-09-20T12:00:00.000Z"),
          userId: other.id,
          vehicleId: foreignVehicle.id,
        },
      }),
    ]);
    const [completedJob, queuedJob, foreignJob] = await Promise.all([
      database.processingJob.create({
        data: {
          completedAt: new Date("2026-09-18T10:00:00.000Z"),
          idempotencyKey: "dashboard-completed",
          imageAssetId: readyImage.id,
          options: {},
          provider: "REMOVEBG",
          status: "COMPLETED",
          userId: owner.id,
          vehicleId: readyVehicle.id,
        },
      }),
      database.processingJob.create({
        data: {
          idempotencyKey: "dashboard-queued",
          imageAssetId: processingImage.id,
          options: {},
          provider: "REMOVEBG",
          status: "QUEUED",
          userId: owner.id,
          vehicleId: processingVehicle.id,
        },
      }),
      database.processingJob.create({
        data: {
          completedAt: new Date("2026-09-18T10:00:00.000Z"),
          idempotencyKey: "dashboard-foreign",
          imageAssetId: foreignImage.id,
          options: {},
          provider: "REMOVEBG",
          status: "COMPLETED",
          userId: other.id,
          vehicleId: foreignVehicle.id,
        },
      }),
    ]);
    await Promise.all([
      database.processedAsset.create({
        data: {
          height: 720,
          jobId: completedJob.id,
          mimeType: "image/webp",
          objectKey: `users/${owner.id}/processed.webp`,
          outputFormat: "WEBP",
          previewObjectKey: `users/${owner.id}/preview.webp`,
          sizeBytes: 500,
          userId: owner.id,
          vehicleId: readyVehicle.id,
          width: 1280,
        },
      }),
      database.usageEvent.create({
        data: {
          billingPeriodKey: "2026-09",
          idempotencyKey: "dashboard-usage-owner",
          jobId: completedJob.id,
          quantity: 1,
          type: "BACKGROUND_REMOVAL_COMPLETED",
          userId: owner.id,
        },
      }),
      database.usageEvent.create({
        data: {
          billingPeriodKey: "2026-09",
          idempotencyKey: "dashboard-session-owner",
          quantity: 1,
          type: "VEHICLE_PROCESSING_BATCH_CREATED",
          userId: owner.id,
        },
      }),
      database.usageEvent.create({
        data: {
          billingPeriodKey: "2026-09",
          idempotencyKey: "dashboard-usage-foreign",
          jobId: foreignJob.id,
          quantity: 8,
          type: "BACKGROUND_REMOVAL_COMPLETED",
          userId: other.id,
        },
      }),
    ]);

    const metrics = await repository.getOwnedMetrics(
      owner.id,
      "2026-09",
      new Date("2026-09-01T00:00:00.000Z"),
    );

    expect(metrics).toEqual({
      activeImageCount: 1,
      completedJobCount: 1,
      imagesProcessed: 1,
      imagesProcessedThisPeriod: 1,
      storageUsedBytes: 3_500n,
      unsuccessfulJobCount: 0,
      vehiclesProcessed: 1,
      vehiclesProcessedThisPeriod: 1,
      vehiclesProcessing: 1,
    });
    expect(queuedJob.id).not.toBe(foreignJob.id);
  });
});
