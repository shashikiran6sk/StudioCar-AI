import { randomUUID } from "node:crypto";
import { WorkerMessageSchema } from "@studiocar/contracts";

import { calculateProcessingOutboxRetryDelay } from "./calculate-processing-outbox-retry-delay";
import {
  PROCESS_IMAGE_MESSAGE_TYPE,
  PROCESS_IMAGE_MESSAGE_VERSION,
  PROCESSING_QUEUE_PUBLISH_ERROR_CODE,
} from "./processing-outbox.constants";
import type {
  ProcessingOutboxDispatcherOptions,
  ProcessingOutboxDispatchRequest,
  ProcessingOutboxDispatchResult,
  ProcessingOutboxRepositoryPort,
  ProcessingQueuePort,
} from "./processing-outbox.types";
import { validateProcessingOutboxDispatcherOptions } from "./validate-processing-outbox-dispatcher-options";

export class ProcessingOutboxDispatcher {
  public constructor(
    private readonly outbox: ProcessingOutboxRepositoryPort,
    private readonly queue: ProcessingQueuePort,
    private readonly options: ProcessingOutboxDispatcherOptions,
    private readonly now: () => Date = () => new Date(),
    private readonly createClaimToken: () => string = randomUUID,
    private readonly random: () => number = Math.random,
  ) {
    validateProcessingOutboxDispatcherOptions(options);
  }

  public async dispatch(
    request: ProcessingOutboxDispatchRequest = {},
  ): Promise<ProcessingOutboxDispatchResult> {
    const claimToken = this.createClaimToken();
    const claimedAt = this.now();
    const messages = await this.outbox.claimPendingOutbox({
      claimExpiresAt: new Date(
        claimedAt.getTime() + this.options.claimTtlMilliseconds,
      ),
      claimToken,
      ...(request.jobIds ? { jobIds: request.jobIds } : {}),
      limit: this.options.batchSize,
      now: claimedAt,
    });
    let failed = 0;
    let published = 0;

    for (const message of messages) {
      try {
        const workerMessage = WorkerMessageSchema.parse({
          version: PROCESS_IMAGE_MESSAGE_VERSION,
          type: PROCESS_IMAGE_MESSAGE_TYPE,
          jobId: message.jobId,
          enqueuedAt: message.createdAt.toISOString(),
        });
        const queueResult = await this.queue.publish(workerMessage);
        const marked = await this.outbox.markOutboxPublished({
          claimToken,
          messageId: message.id,
          publishedAt: this.now(),
          queueMessageId: queueResult.messageId,
        });
        if (marked) {
          published += 1;
          continue;
        }
        failed += 1;
      } catch {
        const retryDelay = calculateProcessingOutboxRetryDelay(
          message.attemptCount,
          this.options.retryBaseMilliseconds,
          this.options.retryMaximumMilliseconds,
          this.random(),
        );
        await this.outbox.releaseOutboxClaim({
          claimToken,
          errorCode: PROCESSING_QUEUE_PUBLISH_ERROR_CODE,
          messageId: message.id,
          nextAttemptAt: new Date(this.now().getTime() + retryDelay),
        });
        failed += 1;
      }
    }

    return { claimed: messages.length, failed, published };
  }
}
