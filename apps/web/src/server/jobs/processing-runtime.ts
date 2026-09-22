import { SQSClient } from "@aws-sdk/client-sqs";
import {
  createSqsClientOptions,
  parseProcessingEnvironment,
} from "@studiocar/config";
import { CommandRateLimitScope, createDatabaseClient } from "@studiocar/database-runtime";
import { PrismaCommandRateLimitRepository } from "../db/repositories/command-rate-limit-repository";
import { PrismaProcessingJobRepository } from "../db/repositories/processing-job-repository";
import { PrismaProcessingJobStatusRepository } from "../db/repositories/processing-job-status-repository";
import { PrismaProcessingOutboxRepository } from "../db/repositories/processing-outbox-repository";
import { ProcessingOutboxDispatcher } from "@studiocar/processing";

import { CommandRateLimiter } from "../security/command-rate-limiter";
import { MILLISECONDS_PER_SECOND } from "../security/command-rate-limiter.constants";
import { ProcessingJobService } from "./processing-job-service";
import { ProcessingStatusService } from "./processing-status-service";
import { SqsProcessingQueue } from "./sqs-processing-queue";
import { toProcessingProvider } from "./to-processing-provider";

export interface ProcessingRuntime {
  dispatchToken: string;
  dispatcher: ProcessingOutboxDispatcher;
  rateLimiter: CommandRateLimiter;
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
    new SQSClient(createSqsClientOptions(environment)),
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
    rateLimiter: new CommandRateLimiter(
      new PrismaCommandRateLimitRepository(database),
      {
        scope: CommandRateLimitScope.PROCESSING_BATCH,
        maximumRequests: environment.PROCESSING_BATCH_MAX_PER_WINDOW,
        windowMilliseconds:
          environment.PROCESSING_BATCH_RATE_LIMIT_WINDOW_SECONDS *
          MILLISECONDS_PER_SECOND,
      },
    ),
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
