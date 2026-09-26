import { LOG_EVENTS } from "@studiocar/observability";
import {
  SqsBatchResponseSchema,
  SqsWorkerEventSchema,
  WorkerMessageSchema,
  type SqsBatchResponse,
  type WorkerMessage,
} from "@studiocar/contracts";
import {
  ApplicationErrorCode,
  logger,
  monitoringContext,
  reportUnexpectedError,
  emitOperationalEvent,
  classifyOperationalError,
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
    const logStartedAt = performance.now();
    let message: WorkerMessage | undefined;
    try {
      const body: unknown = JSON.parse(record.body);
      message = WorkerMessageSchema.parse(body);
      const validatedMessage = message;
      const result = await monitoringContext.run(
        {
          requestId: message.requestId ?? message.jobId,
          batchId: message.batchId,
          jobId: message.jobId,
          queueMessageId: record.messageId,
        },
        async () => {
          logger.log("info", LOG_EVENTS.JOB_RECEIVED);
          try {
            return await processor.process(validatedMessage);
          } catch (error) {
            reportUnexpectedError(error, ApplicationErrorCode.SQS_JOB_FAILED);
            throw error;
          }
        },
      );
      logger.log(
        result.kind === "COMPLETED" || result.kind === "IGNORED"
          ? "info"
          : "error",
        result.kind === "COMPLETED"
          ? LOG_EVENTS.PROCESSING_COMPLETED
          : result.kind === "IGNORED"
            ? LOG_EVENTS.JOB_IGNORED
            : LOG_EVENTS.PROCESSING_FAILED,
        {
          requestId: message.requestId ?? message.jobId,
          batchId: message.batchId,
          jobId: message.jobId,
          queueMessageId: record.messageId,
          durationMs: Math.max(0, performance.now() - logStartedAt),
          outcome: result.kind,
          ...(result.telemetry?.failureKind
            ? { errorCode: result.telemetry.failureKind }
            : {}),
        },
      );
      emitOperationalEvent(
        telemetry,
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
    } catch (error) {
      if (message)
        logger.log("error", LOG_EVENTS.PROCESSING_FAILED, {
          requestId: message.requestId ?? message.jobId,
          batchId: message.batchId,
          jobId: message.jobId,
          queueMessageId: record.messageId,
          durationMs: Math.max(0, performance.now() - logStartedAt),
          errorCode: ApplicationErrorCode.SQS_JOB_FAILED,
          error,
        });
      emitOperationalEvent(
        telemetry,
        createProcessingOperationalEvent({
          error: classifyOperationalError(error),
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
