import { randomUUID } from "node:crypto";
import type { EmailWorkerMessage } from "@studiocar/contracts";

import { createEmailWorkerMessage } from "./create-email-worker-message";
import {
  EMAIL_DELIVERY_ACKNOWLEDGED,
  EMAIL_DELIVERY_DATA_INVALID_ERROR_CODE,
  EMAIL_DELIVERY_NOT_READY,
  EMAIL_DELIVERY_RETRY,
  EMAIL_DELIVERY_TERMINAL,
  EMAIL_DELIVERY_UNEXPECTED_ERROR_CODE,
  MAIL_DELIVERY_DELIVERED,
} from "./email.constants";
import type {
  EmailDeliveryProcessResult,
  EmailDeliveryProcessorOptions,
  EmailDeliveryRepositoryPort,
  MailerPort,
} from "./email.types";
import { validateEmailDeliveryProcessorOptions } from "./validate-email-delivery-processor-options";

export class EmailDeliveryProcessor {
  public constructor(
    private readonly deliveries: EmailDeliveryRepositoryPort,
    private readonly mailer: MailerPort,
    private readonly options: EmailDeliveryProcessorOptions,
    private readonly now: () => Date = () => new Date(),
    private readonly createClaimToken: () => string = randomUUID,
  ) {
    validateEmailDeliveryProcessorOptions(options);
  }

  public async process(
    queueMessage: EmailWorkerMessage,
  ): Promise<EmailDeliveryProcessResult> {
    const claimToken = this.createClaimToken();
    const claimedAt = this.now();
    const claim = await this.deliveries.claimDelivery({
      claimExpiresAt: new Date(
        claimedAt.getTime() + this.options.claimTtlMilliseconds,
      ),
      claimToken,
      messageId: queueMessage.messageId,
      now: claimedAt,
    });
    if (claim.kind === EMAIL_DELIVERY_TERMINAL) {
      return EMAIL_DELIVERY_ACKNOWLEDGED;
    }
    if (claim.kind === EMAIL_DELIVERY_NOT_READY) return EMAIL_DELIVERY_RETRY;
    let message: EmailWorkerMessage;
    try {
      message = createEmailWorkerMessage(
        claim.message,
        this.options.applicationBaseUrl,
      );
    } catch {
      const failed = await this.deliveries.failDelivery({
        claimToken,
        errorCode: EMAIL_DELIVERY_DATA_INVALID_ERROR_CODE,
        failedAt: this.now(),
        messageId: claim.message.id,
      });
      return failed ? EMAIL_DELIVERY_ACKNOWLEDGED : EMAIL_DELIVERY_RETRY;
    }

    let delivery: Awaited<ReturnType<MailerPort["send"]>>;
    try {
      delivery = await this.mailer.send(message);
    } catch {
      await this.deliveries.releaseDelivery({
        claimToken,
        errorCode: EMAIL_DELIVERY_UNEXPECTED_ERROR_CODE,
        messageId: claim.message.id,
      });
      return EMAIL_DELIVERY_RETRY;
    }

    if (delivery.kind === MAIL_DELIVERY_DELIVERED) {
      const completed = await this.deliveries.completeDelivery({
        claimToken,
        deliveredAt: this.now(),
        messageId: claim.message.id,
        providerMessageId: delivery.providerMessageId,
      });
      return completed ? EMAIL_DELIVERY_ACKNOWLEDGED : EMAIL_DELIVERY_RETRY;
    }
    if (delivery.retryable) {
      await this.deliveries.releaseDelivery({
        claimToken,
        errorCode: delivery.errorCode,
        messageId: claim.message.id,
      });
      return EMAIL_DELIVERY_RETRY;
    }
    const failed = await this.deliveries.failDelivery({
      claimToken,
      errorCode: delivery.errorCode,
      failedAt: this.now(),
      messageId: claim.message.id,
    });
    return failed ? EMAIL_DELIVERY_ACKNOWLEDGED : EMAIL_DELIVERY_RETRY;
  }
}
