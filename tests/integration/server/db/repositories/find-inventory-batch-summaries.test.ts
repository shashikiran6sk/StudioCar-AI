import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../../packages/database-runtime/src/client";
import { findInventoryBatchSummaries } from "../../../../../apps/web/src/server/db/repositories/find-inventory-batch-summaries";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const OWNER_EMAIL = "inventory-summary-owner@example.test";
const OTHER_EMAIL = "inventory-summary-other@example.test";
const OLD_BATCH_HASH = "a".repeat(64);
const LATEST_BATCH_HASH = "b".repeat(64);

databaseDescribe("findInventoryBatchSummaries", () => {
  let database: ReturnType<typeof createDatabaseClient>;

  beforeAll(() => {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for integration tests.");
    }
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
  });

  afterEach(async () => {
    await database.user.deleteMany({
      where: { primaryEmail: { in: [OWNER_EMAIL, OTHER_EMAIL] } },
    });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("returns one bounded summary from only the latest owned batch", async () => {
    const [owner, other] = await Promise.all([
      database.user.create({ data: { primaryEmail: OWNER_EMAIL } }),
      database.user.create({ data: { primaryEmail: OTHER_EMAIL } }),
    ]);
    const [vehicle, foreignVehicle] = await Promise.all([
      database.vehicle.create({
        data: { name: "Owned vehicle", status: "PROCESSING", userId: owner.id },
      }),
      database.vehicle.create({
        data: { name: "Foreign vehicle", status: "PROCESSING", userId: other.id },
      }),
    ]);
    const assetIds = Array.from({ length: 5 }, () => randomUUID());
    await database.imageAsset.createMany({
      data: assetIds.map((id) => ({
        id,
        userId: owner.id,
        vehicleId: vehicle.id,
        originalObjectKey: `users/${owner.id}/vehicles/${vehicle.id}/assets/${id}/original/source.jpg`,
        originalFilename: `${id}.jpg`,
        mimeType: "image/jpeg",
        sizeBytes: 1_024,
        status: "UPLOADED",
        uploadExpiresAt: new Date("2026-09-19T10:00:00.000Z"),
        uploadedAt: new Date("2026-09-19T09:00:00.000Z"),
      })),
    });
    const oldJobs = await Promise.all(
      assetIds.slice(0, 3).map((assetId, displayOrder) =>
        database.processingJob.create({
          data: {
            batchIdempotencyKey: "old-inventory-batch",
            batchRequestHash: OLD_BATCH_HASH,
            createdAt: new Date("2026-09-19T10:00:00.000Z"),
            displayOrder,
            idempotencyKey: `old-inventory-job-${String(displayOrder)}`,
            imageAssetId: assetId,
            options: {},
            provider: "REMOVEBG",
            status: displayOrder === 1 ? "FAILED" : "COMPLETED",
            userId: owner.id,
            vehicleId: vehicle.id,
          },
        }),
      ),
    );
    const latestJobs = await Promise.all(
      assetIds.slice(3).map((assetId, displayOrder) =>
        database.processingJob.create({
          data: {
            batchIdempotencyKey: "latest-inventory-batch",
            batchRequestHash: LATEST_BATCH_HASH,
            createdAt: new Date("2026-09-20T10:00:00.000Z"),
            displayOrder,
            idempotencyKey: `latest-inventory-job-${String(displayOrder)}`,
            imageAssetId: assetId,
            options: {},
            provider: "REMOVEBG",
            status: displayOrder === 0 ? "COMPLETED" : "QUEUED",
            userId: owner.id,
            vehicleId: vehicle.id,
          },
        }),
      ),
    );
    const oldPreviewJob = oldJobs[0];
    const latestPreviewJob = latestJobs[0];
    if (!oldPreviewJob || !latestPreviewJob) {
      throw new Error("Expected inventory summary jobs.");
    }
    await database.processedAsset.createMany({
      data: [
        {
          height: 720,
          jobId: oldPreviewJob.id,
          mimeType: "image/webp",
          objectKey: `users/${owner.id}/old.webp`,
          outputFormat: "WEBP",
          previewObjectKey: `users/${owner.id}/old-preview.webp`,
          sizeBytes: 2_048,
          userId: owner.id,
          vehicleId: vehicle.id,
          width: 1_280,
        },
        {
          height: 720,
          jobId: latestPreviewJob.id,
          mimeType: "image/webp",
          objectKey: `users/${owner.id}/latest.webp`,
          outputFormat: "WEBP",
          previewObjectKey: `users/${owner.id}/latest-preview.webp`,
          sizeBytes: 2_048,
          userId: owner.id,
          vehicleId: vehicle.id,
          width: 1_280,
        },
      ],
    });

    const summaries = await findInventoryBatchSummaries(database, owner.id, [
      vehicle.id,
      foreignVehicle.id,
    ]);

    expect([...summaries.values()]).toEqual([
      {
        completedImageCount: 1,
        failedImageCount: 0,
        hasCompletedOutput: true,
        imageCount: 2,
        previewObjectKey: `users/${owner.id}/latest-preview.webp`,
        vehicleId: vehicle.id,
      },
    ]);
    await expect(
      findInventoryBatchSummaries(database, owner.id, []),
    ).resolves.toEqual(new Map());
  });

  it("counts an unchanged re-process as its own batch and keeps the earlier preview", async () => {
    const owner = await database.user.create({ data: { primaryEmail: OWNER_EMAIL } });
    const vehicle = await database.vehicle.create({
      data: { name: "Retried vehicle", status: "PROCESSING", userId: owner.id },
    });
    const assetId = randomUUID();
    await database.imageAsset.create({
      data: {
        id: assetId,
        mimeType: "image/jpeg",
        originalFilename: "front.jpg",
        originalObjectKey: `users/${owner.id}/vehicles/${vehicle.id}/assets/${assetId}/original/source.jpg`,
        sizeBytes: 1_024,
        status: "UPLOADED",
        uploadExpiresAt: new Date("2026-09-19T10:00:00.000Z"),
        userId: owner.id,
        vehicleId: vehicle.id,
      },
    });
    const job = (batch: string, createdAt: string, status: "COMPLETED" | "FAILED" | "QUEUED") =>
      database.processingJob.create({
        data: {
          batchIdempotencyKey: batch,
          // An unchanged re-process repeats the request hash exactly.
          batchRequestHash: OLD_BATCH_HASH,
          createdAt: new Date(createdAt),
          idempotencyKey: `${batch}-job`,
          imageAssetId: assetId,
          options: {},
          provider: "REMOVEBG",
          status,
          userId: owner.id,
          vehicleId: vehicle.id,
        },
      });
    const completed = await job("first-summary-batch", "2026-09-19T10:00:00.000Z", "COMPLETED");
    await job("failed-summary-batch", "2026-09-20T10:00:00.000Z", "FAILED");
    await job("retry-summary-batch", "2026-09-21T10:00:00.000Z", "QUEUED");
    await database.processedAsset.create({
      data: {
        height: 720,
        jobId: completed.id,
        mimeType: "image/webp",
        objectKey: `users/${owner.id}/first.webp`,
        outputFormat: "WEBP",
        previewObjectKey: `users/${owner.id}/first-preview.webp`,
        sizeBytes: 2_048,
        userId: owner.id,
        vehicleId: vehicle.id,
        width: 1_280,
      },
    });

    const summaries = await findInventoryBatchSummaries(database, owner.id, [vehicle.id]);

    expect(summaries.get(vehicle.id)).toEqual({
      completedImageCount: 0,
      failedImageCount: 0,
      hasCompletedOutput: true,
      imageCount: 1,
      previewObjectKey: `users/${owner.id}/first-preview.webp`,
      vehicleId: vehicle.id,
    });
  });
});
