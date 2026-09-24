import { S3Client } from "@aws-sdk/client-s3";
import { createS3ClientOptions, parseUploadEnvironment } from "@studiocar/config";
import { CommandRateLimitScope, createDatabaseClient } from "@studiocar/database-runtime";
import { PrismaCommandRateLimitRepository } from "../db/repositories/command-rate-limit-repository";
import { PrismaImageAssetRepository } from "../db/repositories/image-asset-repository";
import { PrismaStorageDeletionRepository } from "../db/repositories/storage-deletion-repository";

import { CommandRateLimiter } from "../security/command-rate-limiter";
import { S3ObjectDeletionStorage } from "../storage-cleanup/s3-object-deletion-storage";
import { MILLISECONDS_PER_SECOND } from "../security/command-rate-limiter.constants";
import { CommitUploadService } from "./commit-upload-service";
import { CreateUploadIntentService } from "./create-upload-intent-service";
import { S3ObjectStorage } from "./s3-object-storage";
import { RemoveUploadService } from "./remove-upload-service";
import { UploadService } from "./upload-service";

export interface UploadRuntime {
  rateLimiter: CommandRateLimiter;
  removals: RemoveUploadService;
  service: UploadService;
}

let uploadRuntime: UploadRuntime | undefined;

export function getUploadRuntime(): UploadRuntime {
  if (uploadRuntime) return uploadRuntime;

  const environment = parseUploadEnvironment(process.env);
  const database = createDatabaseClient({
    connectionString: environment.DATABASE_URL,
  });
  const s3 = new S3Client(createS3ClientOptions(environment));
  const assets = new PrismaImageAssetRepository(database);
  const storage = new S3ObjectStorage(
    s3,
    environment.S3_BUCKET,
  );
  const intents = new CreateUploadIntentService(assets, storage, {
    maximumUploadBytes: environment.MAX_UPLOAD_BYTES,
    presignedUrlTtlSeconds: environment.PRESIGNED_URL_TTL_SECONDS,
  });
  const commits = new CommitUploadService(assets, storage, {
    maximumImageDimension: environment.MAX_IMAGE_DIMENSION,
    maximumImagePixels: environment.MAX_IMAGE_PIXELS,
  });
  uploadRuntime = {
    rateLimiter: new CommandRateLimiter(
      new PrismaCommandRateLimitRepository(database),
      {
        scope: CommandRateLimitScope.UPLOAD_PRESIGN,
        maximumRequests: environment.UPLOAD_PRESIGN_MAX_PER_WINDOW,
        windowMilliseconds:
          environment.UPLOAD_PRESIGN_RATE_LIMIT_WINDOW_SECONDS *
          MILLISECONDS_PER_SECOND,
      },
    ),
    removals: new RemoveUploadService(
      new PrismaStorageDeletionRepository(database),
      new S3ObjectDeletionStorage(s3, environment.S3_BUCKET),
    ),
    service: new UploadService(intents, commits),
  };
  return uploadRuntime;
}

export function getUploadService(): UploadService {
  return getUploadRuntime().service;
}

export function getUploadRemovalService(): RemoveUploadService {
  return getUploadRuntime().removals;
}
