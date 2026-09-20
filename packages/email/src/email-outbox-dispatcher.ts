import { randomUUID } from "node:crypto";

import { calculateEmailOutboxRetryDelay } from "./calculate-email-outbox-retry-delay";
import { createEmailWorkerMessage } from "./create-email-worker-message";
import { EMAIL_QUEUE_PUBLISH_ERROR_CODE } from "./email.constants";
import type {
  EmailOutboxDispatcherOptions,
  EmailOutboxDispatchResult,
  EmailOutboxRepositoryPort,
  EmailQueuePort,
} from "./email.types";
import { validateEmailOutboxDispatcherOptions } from "./validate-email-outbox-dispatcher-options";

export class EmailOutboxDispatcher {
  public constructor(
    private readonly outbox: EmailOutboxRepositoryPort,
    private readonly queue: EmailQueuePort,
    private readonly options: EmailOutboxDispatcherOptions,
    private readonly now: () => Date = () => new Date(),
    private readonly createClaimToken: () => string = randomUUID,
    private readonly random: () => number = Math.random,
  ) {
    validateEmailOutboxDispatcherOptions(options);
  }

  public async dispatch(): Promise<EmailOutboxDispatchResult> {
    const claimToken = this.createClaimToken();
    const claimedAt = this.now();
    const messages = await this.outbox.claimPendingOutbox({
      claimExpiresAt: new Date(
        claimedAt.getTime() + this.options.claimTtlMilliseconds,
      ),
      claimToken,
      limit: this.options.batchSize,
      now: claimedAt,
    });
    let failed = 0;
    let published = 0;

    for (const message of messages) {
      try {
        const queueResult = await this.queue.publish(
          createEmailWorkerMessage(message, this.options.applicationBaseUrl),
        );
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
        const retryDelay = calculateEmailOutboxRetryDelay(
          message.publishAttemptCount,
          this.options.retryBaseMilliseconds,
          this.options.retryMaximumMilliseconds,
          this.random(),
        );
        await this.outbox.releaseOutboxClaim({
          claimToken,
          errorCode: EMAIL_QUEUE_PUBLISH_ERROR_CODE,
          messageId: message.id,
          nextAttemptAt: new Date(this.now().getTime() + retryDelay),
        });
        failed += 1;
      }
    }

    return { claimed: messages.length, failed, published };
  }
}
