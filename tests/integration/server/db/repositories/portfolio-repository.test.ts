import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../../packages/database-runtime/src/client";
import { PrismaPortfolioRepository } from "../../../../../apps/web/src/server/db/repositories/portfolio-repository";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;

databaseDescribe("PrismaPortfolioRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let repository: PrismaPortfolioRepository;
  const ownerEmail = "portfolio-owner@integration.studiocar.test";
  const otherEmail = "portfolio-other@integration.studiocar.test";

  beforeAll(() => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required for integration tests.");
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    repository = new PrismaPortfolioRepository(database);
  });

  afterEach(async () => {
    await database.user.deleteMany({
      where: { primaryEmail: { in: [ownerEmail, otherEmail] } },
    });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("keeps every owned batch, newest first, with its private keys", async () => {
    const [owner, other] = await Promise.all([
      database.user.create({ data: { primaryEmail: ownerEmail } }),
      database.user.create({ data: { primaryEmail: otherEmail } }),
    ]);
    const vehicle = await database.vehicle.create({
      data: {
        brand: "BMW",
        model: "3 Series",
        name: "2022 BMW 3 Series",
        status: "READY",
        userId: owner.id,
      },
    });
    const image = await database.imageAsset.create({
      data: {
        mimeType: "image/jpeg",
        originalFilename: "front.jpg",
        originalObjectKey: `users/${owner.id}/vehicles/${vehicle.id}/original.jpg`,
        sizeBytes: 1024,
        status: "UPLOADED",
        uploadExpiresAt: new Date("2026-09-20T11:00:00.000Z"),
        userId: owner.id,
        vehicleId: vehicle.id,
      },
    });
    const oldJob = await database.processingJob.create({
      data: {
        batchRequestHash: "a".repeat(64),
        completedAt: new Date("2026-09-19T09:00:00.000Z"),
        idempotencyKey: "portfolio-old-job",
        imageAssetId: image.id,
        options: {},
        provider: "REMOVEBG",
        status: "COMPLETED",
        userId: owner.id,
        vehicleId: vehicle.id,
      },
    });
    const latestJob = await database.processingJob.create({
      data: {
        batchRequestHash: "b".repeat(64),
        completedAt: new Date("2026-09-20T09:00:00.000Z"),
        idempotencyKey: "portfolio-latest-job",
        imageAssetId: image.id,
        options: { background: "PREMIUM_WHITE" },
        provider: "REMOVEBG",
        status: "COMPLETED",
        userId: owner.id,
        vehicleId: vehicle.id,
      },
    });
    await Promise.all([
      database.processedAsset.create({
        data: {
          height: 720,
          jobId: oldJob.id,
          mimeType: "image/webp",
          objectKey: `users/${owner.id}/vehicles/${vehicle.id}/old.webp`,
          outputFormat: "WEBP",
          previewObjectKey: `users/${owner.id}/vehicles/${vehicle.id}/old-preview.webp`,
          sizeBytes: 2048,
          userId: owner.id,
          vehicleId: vehicle.id,
          width: 1280,
        },
      }),
      database.processedAsset.create({
        data: {
          height: 720,
          jobId: latestJob.id,
          mimeType: "image/webp",
          objectKey: `users/${owner.id}/vehicles/${vehicle.id}/latest.webp`,
          outputFormat: "WEBP",
          previewObjectKey: `users/${owner.id}/vehicles/${vehicle.id}/latest-preview.webp`,
          sizeBytes: 2048,
          userId: owner.id,
          vehicleId: vehicle.id,
          width: 1280,
        },
      }),
    ]);

    const portfolio = await repository.findOwned(owner.id, vehicle.id);

    expect(portfolio?.processingJobs.map((job) => job.id)).toEqual([
      latestJob.id,
      oldJob.id,
    ]);
    expect(portfolio?.processingJobs[0]?.processedAsset?.objectKey).toContain(
      "/latest.webp",
    );
    expect(portfolio?.processingJobs[1]?.processedAsset?.objectKey).toContain(
      "/old.webp",
    );
    expect(portfolio?.processingJobs[0]?.imageAsset).toMatchObject({
      originalFilename: "front.jpg",
      status: "UPLOADED",
    });
    await expect(repository.findOwned(other.id, vehicle.id)).resolves.toBeNull();
  });

  it("shows a processing vehicle but never one still in the creation workflow", async () => {
    const owner = await database.user.create({ data: { primaryEmail: ownerEmail } });
    const [processing, draft] = await Promise.all([
      database.vehicle.create({
        data: { name: "Still processing", status: "PROCESSING", userId: owner.id },
      }),
      database.vehicle.create({
        data: { name: "Draft", status: "DRAFT", userId: owner.id },
      }),
    ]);

    await expect(repository.findOwned(owner.id, processing.id)).resolves.toMatchObject({
      processingJobs: [],
      status: "PROCESSING",
    });
    await expect(repository.findOwned(owner.id, draft.id)).resolves.toBeNull();
  });
});
