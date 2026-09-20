import {
  EmailWorkerMessageSchema,
  SqsBatchResponseSchema,
  SqsWorkerEventSchema,
  type SqsBatchResponse,
} from "@studiocar/contracts";
import {
  EMAIL_DELIVERY_RETRY,
  type EmailDeliveryProcessorPort,
} from "@studiocar/email";

export async function handleEmailQueueEvent(
  event: unknown,
  processor: EmailDeliveryProcessorPort,
): Promise<SqsBatchResponse> {
  const parsedEvent = SqsWorkerEventSchema.parse(event);
  const batchItemFailures: { itemIdentifier: string }[] = [];

  for (const record of parsedEvent.Records) {
    try {
      const body: unknown = JSON.parse(record.body);
      const message = EmailWorkerMessageSchema.parse(body);
      const result = await processor.process(message);
      if (result === EMAIL_DELIVERY_RETRY) {
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    } catch {
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return SqsBatchResponseSchema.parse({ batchItemFailures });
}
