import { S3Client } from "@aws-sdk/client-s3";
import {
  parseImageWorkerEnvironment,
  type ImageWorkerEnvironment,
} from "@studiocar/config";
import {
  createDatabaseClient,
  PrismaProcessingWorkerRepository,
} from "@studiocar/database-runtime";
import { ProcessingWorker } from "@studiocar/processing";

import { ProcessingJobExecutor } from "../execution/processing-job-executor";
import { S3ProcessingObjectStorage } from "../storage/s3-processing-object-storage";
import { createBackgroundRemovalProvider } from "./create-background-removal-provider";

export function createImageProcessingWorker(
  environmentValues: Record<string, string | undefined>,
): ProcessingWorker {
  const environment: ImageWorkerEnvironment =
    parseImageWorkerEnvironment(environmentValues);
  const database = createDatabaseClient({
    connectionString: environment.DATABASE_URL,
    poolSize: 2,
  });
  const jobs = new PrismaProcessingWorkerRepository(database);
  const storage = new S3ProcessingObjectStorage(
    new S3Client({ region: environment.AWS_REGION }),
    environment.S3_BUCKET,
    environment.MAX_PROVIDER_OUTPUT_BYTES,
  );
  const provider = createBackgroundRemovalProvider(environment);
  const executor = new ProcessingJobExecutor(storage, provider, {
    maximumInputBytes: environment.MAX_PROVIDER_INPUT_BYTES,
    maximumPixels: environment.MAX_WORKER_IMAGE_PIXELS,
    previewMaximumWidth: environment.PREVIEW_MAX_WIDTH,
  });

  return new ProcessingWorker(jobs, executor, {
    claimTtlMilliseconds: environment.IMAGE_WORKER_CLAIM_TTL_MS,
    retryBaseMilliseconds: environment.PROCESSING_RETRY_BASE_MS,
    retryMaximumMilliseconds: environment.PROCESSING_RETRY_MAX_MS,
  });
}
