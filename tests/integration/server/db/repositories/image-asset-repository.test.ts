import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../../packages/database-runtime/src/client";
import { PrismaImageAssetRepository } from "../../../../../apps/web/src/server/db/repositories/image-asset-repository";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;

databaseDescribe("PrismaImageAssetRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let repository: PrismaImageAssetRepository;
  const ownerEmail = "upload-owner@integration.studiocar.test";
  const otherEmail = "upload-other@integration.studiocar.test";

  beforeAll(() => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required for integration tests.");
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    repository = new PrismaImageAssetRepository(database);
  });

  afterEach(async () => {
    await database.user.deleteMany({
      where: { primaryEmail: { in: [ownerEmail, otherEmail] } },
    });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("reserves one owned asset per idempotency key and hides cross-tenant assets", async () => {
    const [owner, other] = await Promise.all([
      database.user.create({ data: { primaryEmail: ownerEmail } }),
      database.user.create({ data: { primaryEmail: otherEmail } }),
    ]);
    const vehicle = await database.vehicle.create({
      data: { userId: owner.id, name: "Upload test vehicle" },
    });
    const assetId = randomUUID();
    const command = {
      id: assetId,
      userId: owner.id,
      vehicleId: vehicle.id,
      objectKey: `users/${owner.id}/vehicles/${vehicle.id}/assets/${assetId}/original/source.png`,
      filename: "source.png",
      mimeType: "image/png",
      sizeBytes: 24,
      checksumSha256: "00".repeat(32),
      idempotencyKey: "upload-integration-0001",
      uploadExpiresAt: new Date("2026-09-19T12:05:00.000Z"),
    } satisfies Parameters<PrismaImageAssetRepository["reservePendingOwned"]>[0];

    const first = await repository.reservePendingOwned(command);
    const replay = await repository.reservePendingOwned({
      ...command,
      id: randomUUID(),
    });

    expect(first).toMatchObject({ kind: "CREATED" });
    expect(replay).toMatchObject({ kind: "EXISTING" });
    if (first.kind === "VEHICLE_NOT_FOUND" || replay.kind === "VEHICLE_NOT_FOUND") {
      throw new Error("Expected an owned upload reservation.");
    }
    expect(replay.asset.id).toBe(first.asset.id);
    await expect(repository.findOwnedById(other.id, first.asset.id)).resolves.toBeNull();
    await expect(
      repository.reservePendingOwned({
        ...command,
        id: randomUUID(),
        userId: other.id,
        idempotencyKey: "upload-integration-0002",
      }),
    ).resolves.toEqual({ kind: "VEHICLE_NOT_FOUND" });
  });

  it("conditionally completes a pending asset and keeps duplicate commits harmless", async () => {
    const owner = await database.user.create({ data: { primaryEmail: ownerEmail } });
    const vehicle = await database.vehicle.create({
      data: { userId: owner.id, name: "Commit test vehicle" },
    });
    const assetId = randomUUID();
    const reservation = await repository.reservePendingOwned({
      id: assetId,
      userId: owner.id,
      vehicleId: vehicle.id,
      objectKey: `users/${owner.id}/vehicles/${vehicle.id}/assets/${assetId}/original/source.jpg`,
      filename: "source.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 1024,
      checksumSha256: "11".repeat(32),
      idempotencyKey: "upload-integration-0003",
      uploadExpiresAt: new Date("2026-09-19T12:05:00.000Z"),
    });
    if (reservation.kind === "VEHICLE_NOT_FOUND") {
      throw new Error("Expected an owned upload reservation.");
    }
    const uploadedAt = new Date("2026-09-19T12:01:00.000Z");

    const first = await repository.markUploadedOwned(owner.id, assetId, {
      width: 1920,
      height: 1080,
      uploadedAt,
    });
    const replay = await repository.markUploadedOwned(owner.id, assetId, {
      width: 1,
      height: 1,
      uploadedAt: new Date("2026-09-19T12:02:00.000Z"),
    });

    expect(first).toMatchObject({
      status: "UPLOADED",
      width: 1920,
      height: 1080,
      uploadedAt,
    });
    expect(replay).toMatchObject({
      status: "UPLOADED",
      width: 1920,
      height: 1080,
      uploadedAt,
    });
  });
});
