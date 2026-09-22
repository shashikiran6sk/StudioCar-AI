import { SQSClient } from "@aws-sdk/client-sqs";
import {
  createSqsClientOptions,
  parseEmailDispatchEnvironment,
} from "@studiocar/config";
import { createDatabaseClient } from "@studiocar/database-runtime";
import { PrismaEmailOutboxPublisherRepository } from "../db/repositories/email-outbox-publisher-repository";
import { EmailOutboxDispatcher } from "@studiocar/email";

import { SqsEmailQueue } from "./sqs-email-queue";

export interface EmailRuntime {
  dispatchToken: string;
  dispatcher: EmailOutboxDispatcher;
}

let emailRuntime: EmailRuntime | undefined;

export function getEmailRuntime(): EmailRuntime {
  if (emailRuntime) return emailRuntime;

  const environment = parseEmailDispatchEnvironment(process.env);
  const database = createDatabaseClient({
    connectionString: environment.DATABASE_URL,
  });
  const queue = new SqsEmailQueue(
    new SQSClient(createSqsClientOptions(environment)),
    environment.SQS_EMAIL_QUEUE_URL,
  );
  emailRuntime = {
    dispatchToken: environment.EMAIL_DISPATCH_TOKEN,
    dispatcher: new EmailOutboxDispatcher(
      new PrismaEmailOutboxPublisherRepository(database),
      queue,
      {
        applicationBaseUrl: environment.APPLICATION_BASE_URL,
        batchSize: environment.EMAIL_OUTBOX_BATCH_SIZE,
        claimTtlMilliseconds: environment.EMAIL_OUTBOX_CLAIM_TTL_MS,
        retryBaseMilliseconds: environment.EMAIL_OUTBOX_RETRY_BASE_MS,
        retryMaximumMilliseconds: environment.EMAIL_OUTBOX_RETRY_MAX_MS,
      },
    ),
  };
  return emailRuntime;
}
