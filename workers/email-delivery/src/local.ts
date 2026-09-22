import { SQSClient } from "@aws-sdk/client-sqs";
import {
  createSqsClientOptions,
  parseEmailWorkerQueueEnvironment,
} from "@studiocar/config";
import { runLocalQueueConsumer } from "@studiocar/local-queue";

import { handler } from "./handler";

/**
 * Local development entry point. Delivery still runs through the deployed
 * handler, so the email data plane stays asynchronous exactly as in production.
 */
const environment = parseEmailWorkerQueueEnvironment(process.env);
const controller = new AbortController();

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    controller.abort();
  });
}

await runLocalQueueConsumer(
  new SQSClient(createSqsClientOptions(environment)),
  handler,
  {
    queueUrl: environment.SQS_EMAIL_QUEUE_URL,
    signal: controller.signal,
    onError: (error) => {
      process.stderr.write(
        `email worker receive failed: ${
          error instanceof Error ? error.name : "unknown"
        }\n`,
      );
    },
  },
);
