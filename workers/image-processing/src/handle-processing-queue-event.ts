import {
  SqsBatchResponseSchema,
  SqsWorkerEventSchema,
  WorkerMessageSchema,
  type SqsBatchResponse,
  type WorkerMessage,
} from "@studiocar/contracts";
import {
  OperationalTelemetry,
  type OperationalTelemetryPort,
} from "@studiocar/observability";

import { createProcessingOperationalEvent } from "./create-processing-operational-event";
import type { ProcessingMessageProcessorPort } from "./processing-message-handler.types";

const operationalTelemetry = new OperationalTelemetry();

export async function handleProcessingQueueEvent(
  event: unknown,
  processor: ProcessingMessageProcessorPort,
  telemetry: OperationalTelemetryPort = operationalTelemetry,
  now: () => number = Date.now,
): Promise<SqsBatchResponse> {
  const parsedEvent = SqsWorkerEventSchema.parse(event);
  const batchItemFailures: { itemIdentifier: string }[] = [];

  for (const record of parsedEvent.Records) {
    const startedAtMilliseconds = now();
    let message: WorkerMessage | undefined;
    try {
      const body: unknown = JSON.parse(record.body);
      message = WorkerMessageSchema.parse(body);
      const result = await processor.process(message);
      telemetry.emit(
        createProcessingOperationalEvent({
          finishedAtMilliseconds: now(),
          message,
          queueMessageId: record.messageId,
          result,
          startedAtMilliseconds,
        }),
      );
      if (result.kind === "RETRY_DELIVERY") {
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    } catch {
      telemetry.emit(
        createProcessingOperationalEvent({
          finishedAtMilliseconds: now(),
          ...(message ? { message } : {}),
          queueMessageId: record.messageId,
          startedAtMilliseconds,
        }),
      );
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return SqsBatchResponseSchema.parse({ batchItemFailures });
}
