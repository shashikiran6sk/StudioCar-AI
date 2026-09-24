import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../../../packages/database-runtime/src/client";
import { PrismaStorageDeletionRepository } from "../../../../../apps/web/src/server/db/repositories/storage-deletion-repository";
import { ProcessingOptionsSchema } from "../../../../../packages/contracts/src/processing";
import {
  ImageAssetStatus,
  StorageDeletionStatus,
} from "../../../../../packages/database-runtime/generated/prisma/client";

const databaseUrl = process.env["DATABASE_URL"];
const databaseDescribe = databaseUrl ? describe : describe.skip;
const TEST_EMAIL = "storage-cleanup@example.test";
const OTHER_EMAIL = "storage-cleanup-other@example.test";
const OBJECT_KEY_PREFIX = "users/storage-cleanup-test/";
const NOW = new Date("2026-09-20T12:00:00.000Z");
const CUTOFF = new Date("2026-09-19T12:00:00.000Z");

databaseDescribe("PrismaStorageDeletionRepository", () => {
  let database: ReturnType<typeof createDatabaseClient>;
  let repository: PrismaStorageDeletionRepository;

  beforeAll(() => {
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for integration tests.");
    }
    database = createDatabaseClient({ connectionString: databaseUrl, log: [] });
    repository = new PrismaStorageDeletionRepository(database);
  });

  afterEach(async () => {
    await database.storageDeletionOutboxMessage.deleteMany({
      where: { objectKey: { startsWith: OBJECT_KEY_PREFIX } },
    });
    await database.user.deleteMany({
      where: { primaryEmail: { in: [TEST_EMAIL, OTHER_EMAIL] } },
    });
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it("atomically reserves only expired pending uploads and is replay safe", async () => {
    const user = await database.user.create({
      data: { primaryEmail: TEST_EMAIL },
      select: { id: true },
    });
    const vehicle = await database.vehicle.create({
      data: { userId: user.id, name: "Storage cleanup vehicle" },
      select: { id: true },
    });
    const expiredId = randomUUID();
    const recentId = randomUUID();
    const uploadedId = randomUUID();
    await database.imageAsset.createMany({
      data: [
        {
          id: expiredId,
          userId: user.id,
          vehicleId: vehicle.id,
          originalObjectKey: `${OBJECT_KEY_PREFIX}${expiredId}.png`,
          originalFilename: "expired.png",
          mimeType: "image/png",
          sizeBytes: 24,
          uploadExpiresAt: new Date("2026-09-18T00:00:00.000Z"),
        },
        {
          id: recentId,
          userId: user.id,
          vehicleId: vehicle.id,
          originalObjectKey: `${OBJECT_KEY_PREFIX}${recentId}.png`,
          originalFilename: "recent.png",
          mimeType: "image/png",
          sizeBytes: 24,
          uploadExpiresAt: new Date("2026-09-20T00:00:00.000Z"),
        },
        {
          id: uploadedId,
          userId: user.id,
          vehicleId: vehicle.id,
          status: ImageAssetStatus.UPLOADED,
          originalObjectKey: `${OBJECT_KEY_PREFIX}${uploadedId}.png`,
          originalFilename: "uploaded.png",
          mimeType: "image/png",
          sizeBytes: 24,
          uploadExpiresAt: new Date("2026-09-18T00:00:00.000Z"),
          uploadedAt: new Date("2026-09-18T00:01:00.000Z"),
        },
      ],
    });

    await expect(
      repository.reserveExpiredPendingUploads({
        batchSize: 10,
        cutoff: CUTOFF,
        now: NOW,
      }),
    ).resolves.toBe(1);
    await expect(
      repository.reserveExpiredPendingUploads({
        batchSize: 10,
        cutoff: CUTOFF,
        now: NOW,
      }),
    ).resolves.toBe(0);

    await expect(
      database.imageAsset.findUnique({
        where: { id: expiredId },
        select: { invalidReason: true, status: true },
      }),
    ).resolves.toEqual({
      invalidReason: "UPLOAD_EXPIRED",
      status: ImageAssetStatus.DELETED,
    });
    await expect(
      database.imageAsset.findUnique({
        where: { id: recentId },
        select: { status: true },
      }),
    ).resolves.toEqual({ status: ImageAssetStatus.PENDING_UPLOAD });
    await expect(
      database.imageAsset.findUnique({
        where: { id: uploadedId },
        select: { status: true },
      }),
    ).resolves.toEqual({ status: ImageAssetStatus.UPLOADED });
    await expect(
      database.storageDeletionOutboxMessage.findMany({
        select: { imageAssetId: true, objectKey: true, status: true },
      }),
    ).resolves.toEqual([
      {
        imageAssetId: expiredId,
        objectKey: `${OBJECT_KEY_PREFIX}${expiredId}.png`,
        status: StorageDeletionStatus.PENDING,
      },
    ]);
  });

  it("reserves only an owner's unprocessed upload and makes repeats idempotent", async () => {
    const [user, other] = await Promise.all([
      database.user.create({
        data: { primaryEmail: TEST_EMAIL },
        select: { id: true },
      }),
      database.user.create({
        data: { primaryEmail: OTHER_EMAIL },
        select: { id: true },
      }),
    ]);
    const vehicle = await database.vehicle.create({
      data: { userId: user.id, name: "Explicit removal vehicle" },
      select: { id: true },
    });
    const removableId = randomUUID();
    const processingId = randomUUID();
    const completedId = randomUUID();
    await database.imageAsset.createMany({
      data: [removableId, processingId, completedId].map((id) => ({
        id,
        userId: user.id,
        vehicleId: vehicle.id,
        status: ImageAssetStatus.UPLOADED,
        originalObjectKey: `${OBJECT_KEY_PREFIX}${id}.jpg`,
        originalFilename: `${id}.jpg`,
        mimeType: "image/jpeg",
        sizeBytes: 1_024,
        uploadExpiresAt: new Date("2026-09-24T12:05:00.000Z"),
        uploadedAt: NOW,
      })),
    });
    const options = ProcessingOptionsSchema.parse({});
    await database.processingJob.createMany({
      data: [
        {
          idempotencyKey: "explicit-removal-processing",
          imageAssetId: processingId,
          options,
          provider: "REMOVEBG",
          status: "PROCESSING",
          userId: user.id,
          vehicleId: vehicle.id,
        },
        {
          idempotencyKey: "explicit-removal-completed",
          imageAssetId: completedId,
          options,
          provider: "REMOVEBG",
          status: "COMPLETED",
          userId: user.id,
          vehicleId: vehicle.id,
        },
      ],
    });

    await expect(
      repository.reserveUserUploadRemoval({
        assetId: removableId,
        now: NOW,
        userId: other.id,
      }),
    ).resolves.toEqual({ kind: "NOT_FOUND" });
    const reserved = await repository.reserveUserUploadRemoval({
      assetId: removableId,
      now: NOW,
      userId: user.id,
    });
    expect(reserved).toMatchObject({
      kind: "RESERVED",
      objectKey: `${OBJECT_KEY_PREFIX}${removableId}.jpg`,
    });
    if (reserved.kind !== "RESERVED") {
      throw new Error("Expected an explicit deletion reservation.");
    }
    await expect(
      repository.reserveUserUploadRemoval({
        assetId: removableId,
        now: NOW,
        userId: user.id,
      }),
    ).resolves.toEqual(reserved);
    await expect(
      database.imageAsset.findUnique({
        where: { id: removableId },
        select: { invalidReason: true, status: true },
      }),
    ).resolves.toEqual({
      invalidReason: "UPLOAD_REMOVED_BY_USER",
      status: ImageAssetStatus.DELETED,
    });
    await expect(
      repository.reserveUserUploadRemoval({
        assetId: processingId,
        now: NOW,
        userId: user.id,
      }),
    ).resolves.toEqual({ kind: "NOT_REMOVABLE" });
    await expect(
      repository.reserveUserUploadRemoval({
        assetId: completedId,
        now: NOW,
        userId: user.id,
      }),
    ).resolves.toEqual({ kind: "NOT_REMOVABLE" });

    await expect(
      repository.completeUserUploadRemoval({
        deletedAt: NOW,
        messageId: reserved.messageId,
      }),
    ).resolves.toBe(true);
    await expect(
      repository.completeUserUploadRemoval({
        deletedAt: NOW,
        messageId: reserved.messageId,
      }),
    ).resolves.toBe(true);
    await expect(
      repository.reserveUserUploadRemoval({
        assetId: removableId,
        now: NOW,
        userId: user.id,
      }),
    ).resolves.toEqual({ kind: "ALREADY_DELETED" });
  });

  it("claims each deletion once and persists completion, retry, and failure", async () => {
    const user = await database.user.create({
      data: { primaryEmail: TEST_EMAIL },
      select: { id: true },
    });
    const vehicle = await database.vehicle.create({
      data: { userId: user.id, name: "Deletion claim vehicle" },
      select: { id: true },
    });
    const assetIds = [randomUUID(), randomUUID()];
    await database.imageAsset.createMany({
      data: assetIds.map((id) => ({
        id,
        userId: user.id,
        vehicleId: vehicle.id,
        originalObjectKey: `${OBJECT_KEY_PREFIX}${id}.png`,
        originalFilename: `${id}.png`,
        mimeType: "image/png",
        sizeBytes: 24,
        uploadExpiresAt: new Date("2026-09-18T00:00:00.000Z"),
      })),
    });
    await repository.reserveExpiredPendingUploads({
      batchSize: 2,
      cutoff: CUTOFF,
      now: NOW,
    });

    const [firstClaim, competingClaim] = await Promise.all([
      repository.claimPendingDeletions({
        batchSize: 2,
        claimExpiresAt: new Date("2026-09-20T12:02:00.000Z"),
        claimToken: "claim-a",
        now: NOW,
      }),
      repository.claimPendingDeletions({
        batchSize: 2,
        claimExpiresAt: new Date("2026-09-20T12:02:00.000Z"),
        claimToken: "claim-b",
        now: NOW,
      }),
    ]);
    const claimed = [...firstClaim, ...competingClaim];
    expect(claimed).toHaveLength(2);
    expect(new Set(claimed.map((message) => message.id)).size).toBe(2);

    const completedMessage = claimed[0];
    const retryMessage = claimed[1];
    if (!completedMessage || !retryMessage) {
      throw new Error("Expected two claimed deletion messages.");
    }
    const completedToken = completedMessage.claimToken;
    const retryToken = retryMessage.claimToken;
    if (!completedToken || !retryToken) {
      throw new Error("Expected claimed deletion tokens.");
    }
    await expect(
      repository.markDeletionCompleted({
        claimToken: "wrong-token",
        deletedAt: NOW,
        messageId: completedMessage.id,
      }),
    ).resolves.toBe(false);
    await expect(
      repository.markDeletionCompleted({
        claimToken: completedToken,
        deletedAt: NOW,
        messageId: completedMessage.id,
      }),
    ).resolves.toBe(true);
    await expect(
      repository.releaseDeletionClaim({
        claimToken: retryToken,
        errorCode: "S3_DELETE_FAILED",
        messageId: retryMessage.id,
        nextAttemptAt: new Date("2026-09-20T12:05:00.000Z"),
      }),
    ).resolves.toBe(true);

    await expect(
      repository.claimPendingDeletions({
        batchSize: 2,
        claimExpiresAt: new Date("2026-09-20T12:04:00.000Z"),
        claimToken: "claim-too-early",
        now: new Date("2026-09-20T12:03:00.000Z"),
      }),
    ).resolves.toEqual([]);
    const retried = await repository.claimPendingDeletions({
      batchSize: 2,
      claimExpiresAt: new Date("2026-09-20T12:08:00.000Z"),
      claimToken: "claim-retry",
      now: new Date("2026-09-20T12:06:00.000Z"),
    });
    expect(retried).toHaveLength(1);
    expect(retried[0]?.attemptCount).toBe(2);
    await expect(
      repository.markDeletionFailed({
        claimToken: "claim-retry",
        errorCode: "S3_DELETE_FAILED",
        failedAt: new Date("2026-09-20T12:06:00.000Z"),
        messageId: retryMessage.id,
      }),
    ).resolves.toBe(true);

    await expect(
      database.storageDeletionOutboxMessage.findMany({
        orderBy: { status: "asc" },
        select: { status: true },
      }),
    ).resolves.toEqual([
      { status: StorageDeletionStatus.COMPLETED },
      { status: StorageDeletionStatus.FAILED },
    ]);
  });
});
