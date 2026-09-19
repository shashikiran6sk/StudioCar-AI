import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { InventoryQuerySchema } from "../../../../packages/contracts/src/inventory";
import { createDatabaseClient } from "../../../../packages/database/src/client";
import { PrismaInventoryRepository } from "../../../../packages/database/src/repositories/inventory-repository";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;

databaseDescribe("PrismaInventoryRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let repository: PrismaInventoryRepository;
  const ownerEmail = "inventory-owner@integration.studiocar.test";
  const otherEmail = "inventory-other@integration.studiocar.test";

  beforeAll(() => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required for integration tests.");
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    repository = new PrismaInventoryRepository(database);
  });

  afterEach(async () => {
    await database.user.deleteMany({
      where: { primaryEmail: { in: [ownerEmail, otherEmail] } },
    });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("returns operational owned batches with aggregates and private preview keys", async () => {
    const [owner, other] = await Promise.all([
      database.user.create({ data: { primaryEmail: ownerEmail } }),
      database.user.create({ data: { primaryEmail: otherEmail } }),
    ]);
    const [ready, processing] = await Promise.all([
      database.vehicle.create({
        data: {
          internalId: "INTERNAL-SEARCH-100",
          name: "2026 BMW 3 Series",
          status: "READY",
          userId: owner.id,
        },
      }),
      database.vehicle.create({
        data: {
          name: "2026 Audi Q5",
          status: "PROCESSING",
          userId: owner.id,
        },
      }),
      database.vehicle.create({
        data: {
          name: "Other tenant BMW",
          status: "READY",
          userId: other.id,
        },
      }),
      database.vehicle.create({
        data: {
          name: "Unfinished draft",
          status: "DRAFT",
          userId: owner.id,
        },
      }),
    ]);
    const image = await database.imageAsset.create({
      data: {
        checksumSha256: "a".repeat(64),
        mimeType: "image/jpeg",
        originalFilename: "bmw.jpg",
        originalObjectKey: `users/${owner.id}/vehicles/${ready.id}/original.jpg`,
        sizeBytes: 1024,
        status: "UPLOADED",
        uploadExpiresAt: new Date("2026-09-19T11:00:00.000Z"),
        userId: owner.id,
        vehicleId: ready.id,
      },
    });
    const job = await database.processingJob.create({
      data: {
        completedAt: new Date("2026-09-19T10:30:00.000Z"),
        idempotencyKey: "inventory-ready-job-1",
        imageAssetId: image.id,
        options: {
          background: "PREMIUM_WHITE",
          crop: "FIT",
          enhancement: false,
          outputFormat: "WEBP",
          padding: 0,
          platePrivacy: false,
          quality: 90,
          shadow: "NATURAL",
        },
        provider: "REMOVEBG",
        status: "COMPLETED",
        userId: owner.id,
        vehicleId: ready.id,
      },
    });
    await database.processedAsset.create({
      data: {
        height: 720,
        jobId: job.id,
        mimeType: "image/webp",
        objectKey: `users/${owner.id}/vehicles/${ready.id}/processed.webp`,
        outputFormat: "WEBP",
        previewObjectKey: `users/${owner.id}/vehicles/${ready.id}/preview.webp`,
        sizeBytes: 2048,
        userId: owner.id,
        vehicleId: ready.id,
        width: 1280,
      },
    });

    const page = await repository.listOwned(
      owner.id,
      InventoryQuerySchema.parse({ query: "internal-search", sort: "NAME_ASC" }),
    );

    expect(page.counts).toEqual({
      all: 1,
      archived: 0,
      completed: 1,
      failed: 0,
      processing: 0,
    });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({ id: ready.id, name: "2026 BMW 3 Series" });
    expect(page.items[0]?.processingJobs[0]?.processedAsset).toEqual({
      previewObjectKey: `users/${owner.id}/vehicles/${ready.id}/preview.webp`,
    });

    const all = await repository.listOwned(
      owner.id,
      InventoryQuerySchema.parse({}),
    );
    expect(all.items.map(({ id }) => id).sort()).toEqual(
      [ready.id, processing.id].sort(),
    );
    expect(all.counts.all).toBe(2);
  });

  it("applies status filters and rejects cursors outside the filtered tenant scope", async () => {
    const [owner, other] = await Promise.all([
      database.user.create({ data: { primaryEmail: ownerEmail } }),
      database.user.create({ data: { primaryEmail: otherEmail } }),
    ]);
    const [failed, ready, foreign] = await Promise.all([
      database.vehicle.create({
        data: { name: "Failed", status: "PARTIALLY_FAILED", userId: owner.id },
      }),
      database.vehicle.create({
        data: { name: "Ready", status: "READY", userId: owner.id },
      }),
      database.vehicle.create({
        data: { name: "Foreign", status: "READY", userId: other.id },
      }),
    ]);

    const failedPage = await repository.listOwned(
      owner.id,
      InventoryQuerySchema.parse({ filter: "FAILED" }),
    );
    expect(failedPage.items.map(({ id }) => id)).toEqual([failed.id]);

    await expect(
      repository.listOwned(
        owner.id,
        InventoryQuerySchema.parse({ filter: "COMPLETED", cursor: failed.id }),
      ),
    ).resolves.toMatchObject({ items: [], nextCursor: null });
    await expect(
      repository.listOwned(
        owner.id,
        InventoryQuerySchema.parse({ cursor: foreign.id }),
      ),
    ).resolves.toMatchObject({ items: [], nextCursor: null });
    expect(ready.id).not.toBe(foreign.id);
  });
});
