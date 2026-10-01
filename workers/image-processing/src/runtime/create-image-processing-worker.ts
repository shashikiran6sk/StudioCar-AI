import { existsSync } from "node:fs";

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  createS3ClientOptions,
  parseImageWorkerEnvironment,
  type ImageWorkerEnvironment,
} from "@studiocar/config";
import {
  createDatabaseClient,
  PrismaProcessingWorkerRepository,
} from "@studiocar/database-runtime";
import { ProcessingWorker } from "@studiocar/processing";

import { FileStudioBackgroundSource } from "../execution/file-studio-background-source";
import { ProcessingJobExecutor } from "../execution/processing-job-executor";
import { LEONARDO_SOURCE_URL_TTL_SECONDS } from "../providers/leonardo-provider.constants";
import { S3ProcessingObjectStorage } from "../storage/s3-processing-object-storage";
import { createImageProcessingProvider } from "./create-image-processing-provider";
import { resolveStudioBackgroundDirectory } from "./resolve-studio-background-directory";

export function createImageProcessingWorker(
  environmentValues: Record<string, string | undefined>,
  moduleUrl: string,
): ProcessingWorker {
  const environment: ImageWorkerEnvironment =
    parseImageWorkerEnvironment(environmentValues);
  const database = createDatabaseClient({
    connectionString: environment.DATABASE_URL,
    poolSize: 2,
  });
  const jobs = new PrismaProcessingWorkerRepository(database);
  const s3 = new S3Client(createS3ClientOptions(environment));
  const storage = new S3ProcessingObjectStorage(
    s3,
    environment.S3_BUCKET,
    environment.MAX_PROVIDER_OUTPUT_BYTES,
  );
  const provider = createImageProcessingProvider(environment, (objectKey) =>
    getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: environment.S3_BUCKET, Key: objectKey }),
      { expiresIn: LEONARDO_SOURCE_URL_TTL_SECONDS },
    ),
  );
  const executor = new ProcessingJobExecutor(
    storage,
    provider,
    new FileStudioBackgroundSource(
      resolveStudioBackgroundDirectory(moduleUrl, existsSync),
    ),
    {
      maximumInputBytes: environment.MAX_PROVIDER_INPUT_BYTES,
      maximumPixels: environment.MAX_WORKER_IMAGE_PIXELS,
      previewMaximumWidth: environment.PREVIEW_MAX_WIDTH,
    },
  );

  return new ProcessingWorker(jobs, executor, {
    claimTtlMilliseconds: environment.IMAGE_WORKER_CLAIM_TTL_MS,
    retryBaseMilliseconds: environment.PROCESSING_RETRY_BASE_MS,
    retryMaximumMilliseconds: environment.PROCESSING_RETRY_MAX_MS,
  });
}
