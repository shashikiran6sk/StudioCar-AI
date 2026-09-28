import { WorkerMessageSchema } from "@studiocar/contracts";
import { calculateProcessingOutboxRetryDelay } from "./calculate-processing-outbox-retry-delay";
import {
  PROCESS_IMAGE_MESSAGE_TYPE, PROCESS_IMAGE_MESSAGE_VERSION,
  PROCESSING_QUEUE_BATCH_SIZE, PROCESSING_QUEUE_PUBLISH_ERROR_CODE, PUBLICATION_LEASE_RESERVE_MS,
} from "./processing-outbox.constants";
import type {
  MarkProcessingOutboxPublishedInput, ProcessingOutboxDispatcherOptions, ProcessingOutboxMessage,
  ProcessingOutboxRepositoryPort, ProcessingQueuePort, ProcessingOutboxDispatchResult,
} from "./processing-outbox.types";

/** Bounded publication outside transactions, followed only by acknowledged-item bookkeeping. */
export async function dispatchProcessingOutboxBatches(
  messages: ProcessingOutboxMessage[],
  claimToken: string,
  claimExpiresAt: Date,
  publish: NonNullable<ProcessingQueuePort["publishBatch"]>,
  acknowledge: NonNullable<ProcessingOutboxRepositoryPort["markOutboxPublishedBatch"]>,
  release: ProcessingOutboxRepositoryPort["releaseOutboxClaim"],
  options: ProcessingOutboxDispatcherOptions,
  now: () => Date,
  random: () => number,
): Promise<ProcessingOutboxDispatchResult> {
  let published = 0;
  for (let offset = 0; offset < messages.length; offset += PROCESSING_QUEUE_BATCH_SIZE) {
    const batch = messages.slice(offset, offset + PROCESSING_QUEUE_BATCH_SIZE);
    let acknowledged = new Set<string>();
    try {
      const remainingMs = claimExpiresAt.getTime() - now().getTime() - PUBLICATION_LEASE_RESERVE_MS;
      if (remainingMs > 0) {
        const results = await publish(batch.map((message) => WorkerMessageSchema.parse({
          version: PROCESS_IMAGE_MESSAGE_VERSION, type: PROCESS_IMAGE_MESSAGE_TYPE,
          jobId: message.jobId, requestId: message.job?.requestId ?? message.jobId,
          ...(message.job?.batchIdempotencyKey ? { batchId: message.job.batchIdempotencyKey } : {}),
          enqueuedAt: message.createdAt.toISOString(),
        })), remainingMs);
        const successes: MarkProcessingOutboxPublishedInput[] = [];
        for (const message of batch) {
          const matches = results.filter((result) => result.jobId === message.jobId);
          const result = matches[0];
          if (matches.length === 1 && result?.outcome === "PUBLISHED") {
            successes.push({ claimToken, messageId: message.id, publishedAt: now(), queueMessageId: result.messageId });
          }
        }
        acknowledged = new Set(await acknowledge(successes));
      }
    } catch {
      // The lease/outbox survives crashes and uncertain SQS outcomes. Retry is
      // safe even when SQS succeeded but acknowledgement could not commit.
    }
    for (const message of batch) {
      if (acknowledged.has(message.id)) {
        published += 1;
      } else {
        const delay = calculateProcessingOutboxRetryDelay(message.attemptCount,
          options.retryBaseMilliseconds, options.retryMaximumMilliseconds, random());
        await release({ claimToken, messageId: message.id, errorCode: PROCESSING_QUEUE_PUBLISH_ERROR_CODE,
          nextAttemptAt: new Date(now().getTime() + delay) });
      }
    }
  }
  return { claimed: messages.length, published, failed: messages.length - published };
}
