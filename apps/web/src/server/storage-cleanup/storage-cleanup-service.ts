import { randomUUID } from "node:crypto";

import { calculateStorageDeletionRetryDelay } from "./calculate-storage-deletion-retry-delay";
import { STORAGE_DELETION_ERROR_CODE } from "./storage-cleanup.constants";
import type {
  ObjectDeletionStoragePort,
  StorageCleanupApplication,
  StorageCleanupOptions,
  StorageCleanupRepositoryPort,
  StorageCleanupResult,
} from "./storage-cleanup.types";

export class StorageCleanupService implements StorageCleanupApplication {
  public constructor(
    private readonly repository: StorageCleanupRepositoryPort,
    private readonly storage: ObjectDeletionStoragePort,
    private readonly options: StorageCleanupOptions,
    private readonly now: () => Date = () => new Date(),
    private readonly createClaimToken: () => string = randomUUID,
    private readonly random: () => number = Math.random,
  ) {}

  public async run(): Promise<StorageCleanupResult> {
    const startedAt = this.now();
    const reserved = await this.repository.reserveExpiredPendingUploads({
      batchSize: this.options.batchSize,
      cutoff: new Date(
        startedAt.getTime() - this.options.retentionMilliseconds,
      ),
      now: startedAt,
    });
    const claimToken = this.createClaimToken();
    const messages = await this.repository.claimPendingDeletions({
      batchSize: this.options.batchSize,
      claimExpiresAt: new Date(
        startedAt.getTime() + this.options.claimTtlMilliseconds,
      ),
      claimToken,
      now: startedAt,
    });
    const result: StorageCleanupResult = {
      claimConflicts: 0,
      claimed: messages.length,
      deleted: 0,
      failed: 0,
      reserved,
      retrying: 0,
    };

    for (const message of messages) {
      try {
        await this.storage.deleteObject(message.objectKey);
      } catch {
        await this.handleDeletionFailure(message, claimToken, result);
        continue;
      }

      const completed = await this.repository.markDeletionCompleted({
        claimToken,
        deletedAt: this.now(),
        messageId: message.id,
      });
      if (completed) result.deleted += 1;
      else result.claimConflicts += 1;
    }

    return result;
  }

  private async handleDeletionFailure(
    message: { attemptCount: number; id: string },
    claimToken: string,
    result: StorageCleanupResult,
  ): Promise<void> {
    if (message.attemptCount >= this.options.maximumAttempts) {
      const failed = await this.repository.markDeletionFailed({
        claimToken,
        errorCode: STORAGE_DELETION_ERROR_CODE,
        failedAt: this.now(),
        messageId: message.id,
      });
      if (failed) result.failed += 1;
      else result.claimConflicts += 1;
      return;
    }

    const retryDelay = calculateStorageDeletionRetryDelay(
      message.attemptCount,
      this.options.retryBaseMilliseconds,
      this.options.retryMaximumMilliseconds,
      this.random(),
    );
    const released = await this.repository.releaseDeletionClaim({
      claimToken,
      errorCode: STORAGE_DELETION_ERROR_CODE,
      messageId: message.id,
      nextAttemptAt: new Date(this.now().getTime() + retryDelay),
    });
    if (released) result.retrying += 1;
    else result.claimConflicts += 1;
  }
}
