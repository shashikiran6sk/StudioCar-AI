import type { StorageDeletionRecord } from "../db/repositories/storage-deletion-record";
import type {
  ClaimStorageDeletionsCommand,
  CompleteStorageDeletionCommand,
  CompleteUserUploadRemovalCommand,
  FailStorageDeletionCommand,
  ReleaseStorageDeletionCommand,
  ReserveExpiredUploadsCommand,
  ReserveUserUploadRemovalCommand,
  ReserveUserUploadRemovalResult,
} from "../db/repositories/storage-deletion-repository.types";

export interface StorageCleanupRepositoryPort {
  reserveExpiredPendingUploads(
    command: ReserveExpiredUploadsCommand,
  ): Promise<number>;
  claimPendingDeletions(
    command: ClaimStorageDeletionsCommand,
  ): Promise<StorageDeletionRecord[]>;
  markDeletionCompleted(
    command: CompleteStorageDeletionCommand,
  ): Promise<boolean>;
  releaseDeletionClaim(
    command: ReleaseStorageDeletionCommand,
  ): Promise<boolean>;
  markDeletionFailed(command: FailStorageDeletionCommand): Promise<boolean>;
}

export interface ObjectDeletionStoragePort {
  deleteObject(objectKey: string): Promise<void>;
}

export interface UserUploadRemovalRepositoryPort {
  reserveUserUploadRemoval(
    command: ReserveUserUploadRemovalCommand,
  ): Promise<ReserveUserUploadRemovalResult>;
  completeUserUploadRemoval(
    command: CompleteUserUploadRemovalCommand,
  ): Promise<boolean>;
}

export interface StorageCleanupOptions {
  batchSize: number;
  claimTtlMilliseconds: number;
  maximumAttempts: number;
  retentionMilliseconds: number;
  retryBaseMilliseconds: number;
  retryMaximumMilliseconds: number;
}

export interface StorageCleanupResult {
  claimConflicts: number;
  claimed: number;
  deleted: number;
  failed: number;
  reserved: number;
  retrying: number;
}

export interface StorageCleanupApplication {
  run(): Promise<StorageCleanupResult>;
}
