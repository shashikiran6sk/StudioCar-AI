import type { PrismaClient } from "../../generated/prisma/client";
import {
  ImageAssetStatus,
  StorageDeletionStatus,
} from "../../generated/prisma/client";
import { storageDeletionSelect } from "./storage-deletion-record";
import type { StorageDeletionRecord } from "./storage-deletion-record";
import { EXPIRED_UPLOAD_REASON } from "./storage-deletion-repository.constants";
import type {
  ClaimStorageDeletionsCommand,
  CompleteStorageDeletionCommand,
  FailStorageDeletionCommand,
  ReleaseStorageDeletionCommand,
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
