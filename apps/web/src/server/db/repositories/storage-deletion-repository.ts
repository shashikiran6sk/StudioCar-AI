import type { PrismaClient } from "@studiocar/database-runtime";
import {
  ImageAssetStatus,
  StorageDeletionStatus,
} from "@studiocar/database-runtime";
import { storageDeletionSelect } from "./storage-deletion-record";
import type { StorageDeletionRecord } from "./storage-deletion-record";
import { createImageAssetLockKey } from "./create-image-asset-lock-key";
import {
  EXPIRED_UPLOAD_REASON,
  USER_REMOVED_UPLOAD_REASON,
} from "./storage-deletion-repository.constants";
import type {
  ClaimStorageDeletionsCommand,
  CompleteStorageDeletionCommand,
  FailStorageDeletionCommand,
  ReleaseStorageDeletionCommand,
  ReserveUserUploadRemovalCommand,
  ReserveUserUploadRemovalResult,
  CompleteUserUploadRemovalCommand,
  ReserveExpiredUploadsCommand,
} from "./storage-deletion-repository.types";
import { validateStorageDeletionBatchSize } from "./validate-storage-deletion-batch-size";

interface StorageDeletionCandidate {
  id: string;
}

interface ExpiredUploadCandidate {
  id: string;
  originalObjectKey: string;
}

class StorageDeletionReservationLostError extends Error {}

export class PrismaStorageDeletionRepository {
  public constructor(private readonly database: PrismaClient) {}

  public async reserveExpiredPendingUploads(
    command: ReserveExpiredUploadsCommand,
  ): Promise<number> {
    validateStorageDeletionBatchSize(command.batchSize);

    return this.database.$transaction(async (transaction) => {
      const candidates = await transaction.$queryRaw<
        ExpiredUploadCandidate[]
      >`
        SELECT "id", "originalObjectKey"
        FROM "ImageAsset"
        WHERE "status" = ${ImageAssetStatus.PENDING_UPLOAD}::"ImageAssetStatus"
          AND "uploadExpiresAt" < ${command.cutoff}
        ORDER BY "uploadExpiresAt", "id"
        FOR UPDATE SKIP LOCKED
        LIMIT ${command.batchSize}
      `;
      if (candidates.length === 0) return 0;

      const candidateIds = candidates.map((candidate) => candidate.id);
      const deleted = await transaction.imageAsset.updateMany({
        where: {
          id: { in: candidateIds },
          status: ImageAssetStatus.PENDING_UPLOAD,
          uploadExpiresAt: { lt: command.cutoff },
        },
        data: {
          invalidReason: EXPIRED_UPLOAD_REASON,
          status: ImageAssetStatus.DELETED,
        },
      });
      if (deleted.count !== candidates.length) {
        throw new StorageDeletionReservationLostError();
      }

      for (const candidate of candidates) {
        await transaction.storageDeletionOutboxMessage.create({
          data: {
            imageAssetId: candidate.id,
            nextAttemptAt: command.now,
            objectKey: candidate.originalObjectKey,
          },
          select: { id: true },
        });
      }
      return candidates.length;
    });
  }

  public async reserveUserUploadRemoval(
    command: ReserveUserUploadRemovalCommand,
  ): Promise<ReserveUserUploadRemovalResult> {
    return this.database.$transaction(async (transaction) => {
      const lockKey = createImageAssetLockKey(command.assetId);
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`;
      const asset = await transaction.imageAsset.findFirst({
        where: { id: command.assetId, userId: command.userId },
        select: {
          id: true,
          invalidReason: true,
          originalObjectKey: true,
          status: true,
          storageDeletion: {
            select: { id: true, status: true },
          },
          _count: { select: { processingJobs: true } },
        },
      });
      if (!asset) return { kind: "NOT_FOUND" };
      if (asset._count.processingJobs > 0) return { kind: "NOT_REMOVABLE" };
      if (
        asset.status !== ImageAssetStatus.UPLOADED &&
        asset.status !== ImageAssetStatus.DELETED
      ) {
        return { kind: "NOT_REMOVABLE" };
      }
      if (
        asset.status === ImageAssetStatus.DELETED &&
        asset.invalidReason !== USER_REMOVED_UPLOAD_REASON
      ) {
        return { kind: "NOT_REMOVABLE" };
      }
      if (
        asset.status === ImageAssetStatus.DELETED &&
        asset.storageDeletion?.status === StorageDeletionStatus.COMPLETED
      ) {
        return { kind: "ALREADY_DELETED" };
      }

      if (asset.status === ImageAssetStatus.UPLOADED) {
        await transaction.imageAsset.update({
          where: { id: asset.id },
          data: {
            invalidReason: USER_REMOVED_UPLOAD_REASON,
            status: ImageAssetStatus.DELETED,
          },
        });
      }
      const deletion = asset.storageDeletion
        ? await transaction.storageDeletionOutboxMessage.update({
            where: { id: asset.storageDeletion.id },
            data: {
              failedAt: null,
              lastErrorCode: null,
              nextAttemptAt: command.now,
              status: StorageDeletionStatus.PENDING,
            },
            select: { id: true },
          })
        : await transaction.storageDeletionOutboxMessage.create({
            data: {
              imageAssetId: asset.id,
              nextAttemptAt: command.now,
              objectKey: asset.originalObjectKey,
            },
            select: { id: true },
          });
      return {
        kind: "RESERVED",
        messageId: deletion.id,
        objectKey: asset.originalObjectKey,
      };
    });
  }

  public async completeUserUploadRemoval(
    command: CompleteUserUploadRemovalCommand,
  ): Promise<boolean> {
    const result = await this.database.storageDeletionOutboxMessage.updateMany({
      where: {
        id: command.messageId,
        status: {
          in: [StorageDeletionStatus.PENDING, StorageDeletionStatus.FAILED],
        },
      },
      data: {
        claimExpiresAt: null,
        claimedAt: null,
        claimToken: null,
        deletedAt: command.deletedAt,
        failedAt: null,
        lastErrorCode: null,
        status: StorageDeletionStatus.COMPLETED,
      },
    });
    if (result.count === 1) return true;
    const completed = await this.database.storageDeletionOutboxMessage.findFirst({
      where: {
        id: command.messageId,
        status: StorageDeletionStatus.COMPLETED,
      },
      select: { id: true },
    });
    return completed !== null;
  }

  public async claimPendingDeletions(
    command: ClaimStorageDeletionsCommand,
  ): Promise<StorageDeletionRecord[]> {
    validateStorageDeletionBatchSize(command.batchSize);

    return this.database.$transaction(async (transaction) => {
      const candidates = await transaction.$queryRaw<
        StorageDeletionCandidate[]
      >`
        SELECT "id"
        FROM "StorageDeletionOutboxMessage"
        WHERE "status" = ${StorageDeletionStatus.PENDING}::"StorageDeletionStatus"
          AND "nextAttemptAt" <= ${command.now}
          AND ("claimExpiresAt" IS NULL OR "claimExpiresAt" <= ${command.now})
        ORDER BY "nextAttemptAt", "createdAt", "id"
        FOR UPDATE SKIP LOCKED
        LIMIT ${command.batchSize}
      `;
      if (candidates.length === 0) return [];

      const candidateIds = candidates.map((candidate) => candidate.id);
      await transaction.storageDeletionOutboxMessage.updateMany({
        where: {
          id: { in: candidateIds },
          status: StorageDeletionStatus.PENDING,
        },
        data: {
          attemptCount: { increment: 1 },
          claimedAt: command.now,
          claimExpiresAt: command.claimExpiresAt,
          claimToken: command.claimToken,
        },
      });
      return transaction.storageDeletionOutboxMessage.findMany({
        where: { id: { in: candidateIds }, claimToken: command.claimToken },
        orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }, { id: "asc" }],
        select: storageDeletionSelect,
      });
    });
  }

  public async markDeletionCompleted(
    command: CompleteStorageDeletionCommand,
  ): Promise<boolean> {
    const result = await this.database.storageDeletionOutboxMessage.updateMany({
      where: {
        id: command.messageId,
        claimToken: command.claimToken,
        status: StorageDeletionStatus.PENDING,
      },
      data: {
        claimExpiresAt: null,
        claimedAt: null,
        claimToken: null,
        deletedAt: command.deletedAt,
        lastErrorCode: null,
        status: StorageDeletionStatus.COMPLETED,
      },
    });
    return result.count === 1;
  }

  public async releaseDeletionClaim(
    command: ReleaseStorageDeletionCommand,
  ): Promise<boolean> {
    const result = await this.database.storageDeletionOutboxMessage.updateMany({
      where: {
        id: command.messageId,
        claimToken: command.claimToken,
        status: StorageDeletionStatus.PENDING,
      },
      data: {
        claimExpiresAt: null,
        claimedAt: null,
        claimToken: null,
        lastErrorCode: command.errorCode,
        nextAttemptAt: command.nextAttemptAt,
      },
    });
    return result.count === 1;
  }

  public async markDeletionFailed(
    command: FailStorageDeletionCommand,
  ): Promise<boolean> {
    const result = await this.database.storageDeletionOutboxMessage.updateMany({
      where: {
        id: command.messageId,
        claimToken: command.claimToken,
        status: StorageDeletionStatus.PENDING,
      },
      data: {
        claimExpiresAt: null,
        claimedAt: null,
        claimToken: null,
        failedAt: command.failedAt,
        lastErrorCode: command.errorCode,
        status: StorageDeletionStatus.FAILED,
      },
    });
    return result.count === 1;
  }
}
