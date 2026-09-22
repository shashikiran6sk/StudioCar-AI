import { S3Client } from "@aws-sdk/client-s3";
import { parseStorageCleanupEnvironment } from "@studiocar/config";
import { createDatabaseClient } from "@studiocar/database-runtime";
import { PrismaStorageDeletionRepository } from "../db/repositories/storage-deletion-repository";

import { S3ObjectDeletionStorage } from "./s3-object-deletion-storage";
import { STORAGE_CLEANUP_MILLISECONDS_PER_HOUR } from "./storage-cleanup.constants";
import { StorageCleanupService } from "./storage-cleanup-service";

export interface StorageCleanupRuntime {
  cleanupToken: string;
  service: StorageCleanupService;
}

let storageCleanupRuntime: StorageCleanupRuntime | undefined;

export function getStorageCleanupRuntime(): StorageCleanupRuntime {
  if (storageCleanupRuntime) return storageCleanupRuntime;

  const environment = parseStorageCleanupEnvironment(process.env);
  const database = createDatabaseClient({
    connectionString: environment.DATABASE_URL,
  });
  storageCleanupRuntime = {
    cleanupToken: environment.STORAGE_CLEANUP_TOKEN,
    service: new StorageCleanupService(
      new PrismaStorageDeletionRepository(database),
      new S3ObjectDeletionStorage(
        new S3Client({ region: environment.AWS_REGION }),
        environment.S3_BUCKET,
      ),
      {
        batchSize: environment.STORAGE_CLEANUP_BATCH_SIZE,
        claimTtlMilliseconds: environment.STORAGE_DELETION_CLAIM_TTL_MS,
        maximumAttempts: environment.STORAGE_DELETION_MAX_ATTEMPTS,
        retentionMilliseconds:
          environment.ABANDONED_UPLOAD_RETENTION_HOURS *
          STORAGE_CLEANUP_MILLISECONDS_PER_HOUR,
        retryBaseMilliseconds: environment.STORAGE_DELETION_RETRY_BASE_MS,
        retryMaximumMilliseconds: environment.STORAGE_DELETION_RETRY_MAX_MS,
      },
    ),
  };
  return storageCleanupRuntime;
}
