import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../packages/database-runtime/src/client";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const OWNER_EMAIL = "reconcile-attention@integration.studiocar.test";
const MIGRATION_SQL = readFileSync(
  path.resolve(
    __dirname,
    "../../../../apps/web/prisma/migrations/20260923180000_reconcile_vehicle_attention/migration.sql",
  ),
  "utf8",
);

type JobStatus = "COMPLETED" | "FAILED" | "RETRYING";

databaseDescribe("reconcile_vehicle_attention migration", () => {
  let database: ReturnType<typeof createDatabaseClient>;

  beforeAll(() => {
    if (!databaseUrl) throw new Error("DATABASE_URL is required for integration tests.");
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
  });

  afterEach(async () => {
    await database.user.deleteMany({ where: { primaryEmail: OWNER_EMAIL } });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  /** A PARTIALLY_FAILED vehicle with one job per batch, oldest first. */
  async function seedVehicle(userId: string, batches: JobStatus[]) {
    const vehicle = await database.vehicle.create({
      data: { name: "Reconciled vehicle", status: "PARTIALLY_FAILED", userId },
    });
    for (const [index, status] of batches.entries()) {
      const assetId = randomUUID();
      await database.imageAsset.create({
        data: {
          id: assetId,
          mimeType: "image/png",
          originalFilename: `${String(index)}.png`,
          originalObjectKey: `users/${userId}/vehicles/${vehicle.id}/assets/${assetId}/original/source.png`,
          sizeBytes: 1_024,
          status: "UPLOADED",
          uploadExpiresAt: new Date("2026-09-23T13:30:00.000Z"),
          userId,
          vehicleId: vehicle.id,
        },
      });
      await database.processingJob.create({
        data: {
          batchIdempotencyKey: `${vehicle.id}-batch-${String(index)}`,
          createdAt: new Date(Date.UTC(2026, 8, 23, 13, 20 + index)),
          idempotencyKey: `${vehicle.id}-job-${String(index)}`,
          imageAssetId: assetId,
          options: {},
          provider: "REMOVEBG",
          status,
          userId,
          vehicleId: vehicle.id,
        },
      });
    }
    return vehicle.id;
  }

  async function statusOf(vehicleId: string) {
    const vehicle = await database.vehicle.findUnique({
      where: { id: vehicleId },
      select: { status: true },
    });
    return vehicle?.status;
  }

  it("clears attention only where the newest batch completed", async () => {
    const owner = await database.user.create({ data: { primaryEmail: OWNER_EMAIL } });
    const replaced = await seedVehicle(owner.id, ["FAILED", "FAILED", "COMPLETED"]);
    const stillFailed = await seedVehicle(owner.id, ["COMPLETED", "FAILED"]);
    const retrying = await seedVehicle(owner.id, ["FAILED", "RETRYING"]);
    const noJobs = await seedVehicle(owner.id, []);

    await database.$executeRawUnsafe(MIGRATION_SQL);
    await database.$executeRawUnsafe(MIGRATION_SQL);

    await expect(statusOf(replaced)).resolves.toBe("READY");
    await expect(statusOf(stillFailed)).resolves.toBe("PARTIALLY_FAILED");
    await expect(statusOf(retrying)).resolves.toBe("PARTIALLY_FAILED");
    await expect(statusOf(noJobs)).resolves.toBe("PARTIALLY_FAILED");
  });
});
