import { S3Client } from "@aws-sdk/client-s3";
import { parseUploadEnvironment } from "@studiocar/config";
import {
  createDatabaseClient,
  PrismaImageAssetRepository,
} from "@studiocar/database";

import { CommitUploadService } from "./commit-upload-service";
import { CreateUploadIntentService } from "./create-upload-intent-service";
import { S3ObjectStorage } from "./s3-object-storage";
import { UploadService } from "./upload-service";

let uploadService: UploadService | undefined;

export function getUploadService(): UploadService {
  if (uploadService) return uploadService;

  const environment = parseUploadEnvironment(process.env);
  const database = createDatabaseClient({
    connectionString: environment.DATABASE_URL,
  });
  const assets = new PrismaImageAssetRepository(database);
  const storage = new S3ObjectStorage(
    new S3Client({ region: environment.AWS_REGION }),
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
  uploadService = new UploadService(intents, commits);
  return uploadService;
}
