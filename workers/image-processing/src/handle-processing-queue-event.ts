import {
  SqsBatchResponseSchema,
  SqsWorkerEventSchema,
  WorkerMessageSchema,
  type SqsBatchResponse,
} from "@studiocar/contracts";

import type { ProcessingMessageProcessorPort } from "./processing-message-handler.types";

export async function handleProcessingQueueEvent(
  event: unknown,
  processor: ProcessingMessageProcessorPort,
): Promise<SqsBatchResponse> {
  const parsedEvent = SqsWorkerEventSchema.parse(event);
  const batchItemFailures: { itemIdentifier: string }[] = [];

  for (const record of parsedEvent.Records) {
    try {
      const body: unknown = JSON.parse(record.body);
      const message = WorkerMessageSchema.parse(body);
      const result = await processor.process(message);
      if (result.kind === "RETRY_DELIVERY") {
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    } catch {
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return SqsBatchResponseSchema.parse({ batchItemFailures });
}
