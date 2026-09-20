import { describe, expect, it, vi } from "vitest";

import { StorageCleanupService } from "../../../../apps/web/src/server/storage-cleanup/storage-cleanup-service";
import type {
  ObjectDeletionStoragePort,
  StorageCleanupRepositoryPort,
} from "../../../../apps/web/src/server/storage-cleanup/storage-cleanup.types";
import { StorageDeletionStatus } from "../../../../packages/database/generated/prisma/client";
import type { StorageDeletionRecord } from "../../../../packages/database/src/repositories/storage-deletion-record";

const NOW = new Date("2026-09-20T12:00:00.000Z");
const CLAIM_TOKEN = "storage-claim-token";

function message(id: string, attemptCount: number): StorageDeletionRecord {
  return {
    id,
    imageAssetId: `asset-${id}`,
    objectKey: `users/user/assets/${id}/original/source.png`,
    status: StorageDeletionStatus.PENDING,
    attemptCount,
    nextAttemptAt: NOW,
    claimedAt: NOW,
    claimExpiresAt: new Date("2026-09-20T12:02:00.000Z"),
    claimToken: CLAIM_TOKEN,
    deletedAt: null,
    failedAt: null,
    lastErrorCode: null,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function repository(
  messages: StorageDeletionRecord[],
): StorageCleanupRepositoryPort {
  return {
    reserveExpiredPendingUploads: vi.fn(async () => 1),
    claimPendingDeletions: vi.fn(async () => messages),
    markDeletionCompleted: vi.fn(async () => true),
    releaseDeletionClaim: vi.fn(async () => true),
    markDeletionFailed: vi.fn(async () => true),
  };
}

const OPTIONS = {
  batchSize: 10,
  claimTtlMilliseconds: 120_000,
  maximumAttempts: 3,
  retentionMilliseconds: 24 * 60 * 60 * 1_000,
  retryBaseMilliseconds: 1_000,
  retryMaximumMilliseconds: 10_000,
};

describe("StorageCleanupService", () => {
  it("reserves expired intents and completes idempotent object deletion", async () => {
    const pending = message("message-1", 1);
    const cleanupRepository = repository([pending]);
    const storage: ObjectDeletionStoragePort = { deleteObject: vi.fn() };
    const service = new StorageCleanupService(
      cleanupRepository,
      storage,
      OPTIONS,
      () => NOW,
      () => CLAIM_TOKEN,
      () => 0,
    );

    await expect(service.run()).resolves.toEqual({
      claimConflicts: 0,
      claimed: 1,
      deleted: 1,
      failed: 0,
      reserved: 1,
      retrying: 0,
    });
    expect(cleanupRepository.reserveExpiredPendingUploads).toHaveBeenCalledWith(
      {
        batchSize: 10,
        cutoff: new Date("2026-09-19T12:00:00.000Z"),
        now: NOW,
      },
    );
    expect(cleanupRepository.claimPendingDeletions).toHaveBeenCalledWith({
      batchSize: 10,
      claimExpiresAt: new Date("2026-09-20T12:02:00.000Z"),
      claimToken: CLAIM_TOKEN,
      now: NOW,
    });
    expect(storage.deleteObject).toHaveBeenCalledWith(pending.objectKey);
    expect(cleanupRepository.markDeletionCompleted).toHaveBeenCalledWith({
      claimToken: CLAIM_TOKEN,
      deletedAt: NOW,
      messageId: pending.id,
    });
  });

  it("releases transient failures and terminates exhausted deletions", async () => {
    const retry = message("message-retry", 1);
    const exhausted = message("message-exhausted", 3);
    const cleanupRepository = repository([retry, exhausted]);
    const storage: ObjectDeletionStoragePort = {
      deleteObject: vi.fn(async () => {
        throw new Error("storage unavailable");
      }),
    };
    const service = new StorageCleanupService(
      cleanupRepository,
      storage,
      OPTIONS,
      () => NOW,
      () => CLAIM_TOKEN,
      () => 0,
    );

    await expect(service.run()).resolves.toEqual({
      claimConflicts: 0,
      claimed: 2,
      deleted: 0,
      failed: 1,
      reserved: 1,
      retrying: 1,
    });
    expect(cleanupRepository.releaseDeletionClaim).toHaveBeenCalledWith({
      claimToken: CLAIM_TOKEN,
      errorCode: "S3_DELETE_FAILED",
      messageId: retry.id,
      nextAttemptAt: new Date("2026-09-20T12:00:00.500Z"),
    });
    expect(cleanupRepository.markDeletionFailed).toHaveBeenCalledWith({
      claimToken: CLAIM_TOKEN,
      errorCode: "S3_DELETE_FAILED",
      failedAt: NOW,
      messageId: exhausted.id,
    });
  });
});
