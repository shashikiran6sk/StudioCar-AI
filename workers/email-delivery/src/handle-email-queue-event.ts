import {
  EmailWorkerMessageSchema,
  SqsBatchResponseSchema,
  SqsWorkerEventSchema,
  type SqsBatchResponse,
} from "@studiocar/contracts";

import type { MailerPort } from "./mailer.types";
import { renderEmailMessage } from "./render-email-message";

export async function handleEmailQueueEvent(
  event: unknown,
  mailer: MailerPort,
): Promise<SqsBatchResponse> {
  const parsedEvent = SqsWorkerEventSchema.parse(event);
  const batchItemFailures: { itemIdentifier: string }[] = [];

  for (const record of parsedEvent.Records) {
    try {
      const body: unknown = JSON.parse(record.body);
      const message = EmailWorkerMessageSchema.parse(body);
      const result = await mailer.send(renderEmailMessage(message));
      if (result.kind === "FAILED" && result.retryable) {
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    } catch {
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return SqsBatchResponseSchema.parse({ batchItemFailures });
}
