import { SQSClient } from "@aws-sdk/client-sqs";
import {
  createSqsClientOptions,
  parseImageWorkerQueueEnvironment,
} from "@studiocar/config";
import { runLocalQueueConsumer } from "@studiocar/local-queue";

import { handler } from "./handler";

/**
 * Local development entry point. It drives the same deployed handler the
 * Lambda runtime does, so retry decisions and partial-batch acknowledgement
 * behave identically against the local queue.
 */
const environment = parseImageWorkerQueueEnvironment(process.env);
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
    queueUrl: environment.SQS_IMAGE_QUEUE_URL,
    signal: controller.signal,
    onError: (error) => {
      process.stderr.write(
        `image worker receive failed: ${
          error instanceof Error ? error.name : "unknown"
        }\n`,
      );
    },
  },
);
