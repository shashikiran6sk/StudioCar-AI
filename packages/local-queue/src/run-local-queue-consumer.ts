import {
  DeleteMessageBatchCommand,
  ReceiveMessageCommand,
  type SQSClient,
} from "@aws-sdk/client-sqs";

import {
  DEFAULT_ERROR_DELAY_MS,
  DEFAULT_IDLE_DELAY_MS,
  DEFAULT_MAX_MESSAGES,
  DEFAULT_WAIT_TIME_SECONDS,
  INVALID_CONSUMER_OPTIONS_MESSAGE,
  MAXIMUM_MAX_MESSAGES,
  MAXIMUM_WAIT_TIME_SECONDS,
} from "./local-queue.constants";
import type {
  LocalQueueConsumerOptions,
  LocalQueueHandler,
  LocalQueueMessage,
} from "./local-queue.types";
import { selectDeletableReceipts } from "./select-deletable-receipts";

function delay(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, milliseconds);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

function toLocalQueueMessages(
  messages: readonly {
    MessageId?: string | undefined;
    ReceiptHandle?: string | undefined;
    Body?: string | undefined;
  }[],
): LocalQueueMessage[] {
  return messages.flatMap((message) =>
    message.MessageId && message.ReceiptHandle && message.Body
      ? [
          {
            messageId: message.MessageId,
            receiptHandle: message.ReceiptHandle,
            body: message.Body,
          },
        ]
      : [],
  );
}

/**
 * Long-polls an SQS-compatible queue and drives the worker's deployed handler
 * with the event shape Lambda would deliver. This exists so local development
 * exercises the real worker, its retry decisions, and its partial-batch
 * acknowledgement rather than a separate code path.
 */
export async function runLocalQueueConsumer(
  client: SQSClient,
  handler: LocalQueueHandler,
  options: LocalQueueConsumerOptions,
): Promise<void> {
  const waitTimeSeconds = options.waitTimeSeconds ?? DEFAULT_WAIT_TIME_SECONDS;
  const maxMessages = options.maxMessages ?? DEFAULT_MAX_MESSAGES;
  if (
    waitTimeSeconds < 0 ||
    waitTimeSeconds > MAXIMUM_WAIT_TIME_SECONDS ||
    maxMessages < 1 ||
    maxMessages > MAXIMUM_MAX_MESSAGES
  ) {
    throw new RangeError(INVALID_CONSUMER_OPTIONS_MESSAGE);
  }

  const idleDelayMs = options.idleDelayMs ?? DEFAULT_IDLE_DELAY_MS;
  const errorDelayMs = options.errorDelayMs ?? DEFAULT_ERROR_DELAY_MS;

  while (!options.signal?.aborted) {
    try {
      const received = await client.send(
        new ReceiveMessageCommand({
          QueueUrl: options.queueUrl,
          MaxNumberOfMessages: maxMessages,
          WaitTimeSeconds: waitTimeSeconds,
        }),
      );
      const messages = toLocalQueueMessages(received.Messages ?? []);
      if (messages.length === 0) {
        await delay(idleDelayMs, options.signal);
        continue;
      }

      const response = await handler({
        Records: messages.map(({ messageId, body }) => ({ messageId, body })),
      });
      const deletable = selectDeletableReceipts(messages, response);
      if (deletable.length > 0) {
        await client.send(
          new DeleteMessageBatchCommand({
            QueueUrl: options.queueUrl,
            Entries: deletable.map((message) => ({
              Id: message.messageId,
              ReceiptHandle: message.receiptHandle,
            })),
          }),
        );
      }
    } catch (error) {
      options.onError?.(error);
      await delay(errorDelayMs, options.signal);
    }
  }
}
