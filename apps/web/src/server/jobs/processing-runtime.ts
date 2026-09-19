import { SQSClient } from "@aws-sdk/client-sqs";
import { parseProcessingEnvironment } from "@studiocar/config";
import {
  createDatabaseClient,
  PrismaProcessingJobRepository,
  PrismaProcessingJobStatusRepository,
  PrismaProcessingOutboxRepository,
} from "@studiocar/database";
import { ProcessingOutboxDispatcher } from "@studiocar/processing";

import { ProcessingJobService } from "./processing-job-service";
import { ProcessingStatusService } from "./processing-status-service";
import { SqsProcessingQueue } from "./sqs-processing-queue";
import { toProcessingProvider } from "./to-processing-provider";

export interface ProcessingRuntime {
  dispatchToken: string;
  dispatcher: ProcessingOutboxDispatcher;
  service: ProcessingJobService;
  statusService: ProcessingStatusService;
}

let processingRuntime: ProcessingRuntime | undefined;

export function getProcessingRuntime(): ProcessingRuntime {
  if (processingRuntime) return processingRuntime;

  const environment = parseProcessingEnvironment(process.env);
  const database = createDatabaseClient({
    connectionString: environment.DATABASE_URL,
  });
  const queue = new SqsProcessingQueue(
    new SQSClient({ region: environment.AWS_REGION }),
    environment.SQS_IMAGE_QUEUE_URL,
  );
  const dispatcher = new ProcessingOutboxDispatcher(
    new PrismaProcessingOutboxRepository(database),
    queue,
    {
      batchSize: environment.PROCESSING_OUTBOX_BATCH_SIZE,
      claimTtlMilliseconds: environment.PROCESSING_OUTBOX_CLAIM_TTL_MS,
      retryBaseMilliseconds: environment.PROCESSING_OUTBOX_RETRY_BASE_MS,
      retryMaximumMilliseconds: environment.PROCESSING_OUTBOX_RETRY_MAX_MS,
    },
  );
  processingRuntime = {
    dispatchToken: environment.PROCESSING_DISPATCH_TOKEN,
    dispatcher,
    service: new ProcessingJobService(
      new PrismaProcessingJobRepository(database),
      dispatcher,
      toProcessingProvider(environment.BACKGROUND_REMOVAL_PROVIDER),
    ),
    statusService: new ProcessingStatusService(
      new PrismaProcessingJobStatusRepository(database),
    ),
  };
  return processingRuntime;
}
