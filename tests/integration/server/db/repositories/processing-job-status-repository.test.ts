import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../../packages/database-runtime/src/client";
import { PrismaProcessingJobStatusRepository } from "../../../../../apps/web/src/server/db/repositories/processing-job-status-repository";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const ownerEmail = "status-owner@integration.studiocar.test";
const otherEmail = "status-other@integration.studiocar.test";

databaseDescribe("PrismaProcessingJobStatusRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let repository: PrismaProcessingJobStatusRepository;

  beforeAll(() => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required for integration tests.");
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    repository = new PrismaProcessingJobStatusRepository(database);
  });

  afterEach(async () => {
    await database.user.deleteMany({
      where: { primaryEmail: { in: [ownerEmail, otherEmail] } },
    });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("returns owned jobs in request order and rejects mixed-tenant batches", async () => {
    const [owner, other] = await Promise.all([
      database.user.create({ data: { primaryEmail: ownerEmail } }),
      database.user.create({ data: { primaryEmail: otherEmail } }),
    ]);
    const [ownerVehicle, otherVehicle] = await Promise.all([
      database.vehicle.create({ data: { userId: owner.id, name: "Owner car" } }),
      database.vehicle.create({ data: { userId: other.id, name: "Other car" } }),
    ]);

    async function createJob(userId: string, vehicleId: string, suffix: string) {
      const assetId = randomUUID();
      await database.imageAsset.create({
        data: {
          id: assetId,
          userId,
          vehicleId,
          status: "UPLOADED",
          originalObjectKey: `users/${userId}/vehicles/${vehicleId}/assets/${assetId}/original/source.jpg`,
          originalFilename: `${suffix}.jpg`,
          mimeType: "image/jpeg",
          sizeBytes: 1_024,
          uploadExpiresAt: new Date("2026-09-19T12:05:00.000Z"),
        },
      });
      return database.processingJob.create({
        data: {
          userId,
          vehicleId,
          imageAssetId: assetId,
          provider: "REMOVEBG",
          options: {},
          idempotencyKey: `status-${suffix}`,
        },
      });
    }

    const [first, second, alien] = await Promise.all([
      createJob(owner.id, ownerVehicle.id, "first"),
      createJob(owner.id, ownerVehicle.id, "second"),
      createJob(other.id, otherVehicle.id, "alien"),
    ]);

    const found = await repository.findOwned(owner.id, [second.id, first.id]);
    expect(found.kind).toBe("FOUND");
    if (found.kind === "FOUND") {
      expect(found.jobs.map((job) => job.id)).toEqual([second.id, first.id]);
      expect(found.jobs[0]?.vehicle.name).toBe("Owner car");
    }
    await expect(
      repository.findOwned(owner.id, [first.id, alien.id]),
    ).resolves.toEqual({ kind: "NOT_FOUND" });
  });
});
