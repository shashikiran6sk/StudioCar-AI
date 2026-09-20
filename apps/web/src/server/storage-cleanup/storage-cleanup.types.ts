import type {
  ClaimStorageDeletionsCommand,
  CompleteStorageDeletionCommand,
  FailStorageDeletionCommand,
  ReleaseStorageDeletionCommand,
  ReserveExpiredUploadsCommand,
  StorageDeletionRecord,
} from "@studiocar/database";

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
