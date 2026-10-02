import { measureStage, PerformanceStage } from "@studiocar/observability";

import { PROCESSING_QUEUE_BATCH_SIZE } from "@studiocar/processing";
import { LOG_EVENTS } from "@studiocar/observability";
import {
  ApplicationErrorCode,
  logger,
  monitoringContext,
  reportUnexpectedError,
} from "@studiocar/observability";
import {
  SendMessageBatchCommand,
  type SendMessageBatchCommandOutput,
  SendMessageCommand,
  SQSClient,
  type SendMessageCommandOutput,
} from "@aws-sdk/client-sqs";
import type {
  ProcessingQueueBatchResult,
  ProcessingQueuePort,
  ProcessingQueuePublishResult,
} from "@studiocar/processing";
import type { WorkerMessage } from "@studiocar/contracts";

import { PROCESSING_QUEUE_BATCH_SIZE_ERROR, PROCESSING_QUEUE_MESSAGE_MISSING_ID_ERROR } from "./processing-queue.constants";

type SendMessage = (
  command: SendMessageCommand,
) => Promise<SendMessageCommandOutput>;

export class SqsProcessingQueue implements ProcessingQueuePort {
  public constructor(
    private readonly client: SQSClient,
    private readonly queueUrl: string,
    private readonly sendMessage: SendMessage = (command) =>
      this.client.send(command),
    private readonly sendBatch: (command: SendMessageBatchCommand, timeoutMilliseconds: number) => Promise<SendMessageBatchCommandOutput> =
      (command, timeoutMilliseconds) => this.client.send(command, { abortSignal: AbortSignal.timeout(timeoutMilliseconds) }),
  ) {}

  public async publishBatch(messages: WorkerMessage[], timeoutMilliseconds: number): Promise<ProcessingQueueBatchResult[]> {
    if (messages.length < 1 || messages.length > PROCESSING_QUEUE_BATCH_SIZE) {
      throw new RangeError(PROCESSING_QUEUE_BATCH_SIZE_ERROR);
    }
    const startedAt = performance.now();
    const response = await measureStage(PerformanceStage.SQS_PUBLICATION, () => this.sendBatch(new SendMessageBatchCommand({
      QueueUrl: this.queueUrl,
      Entries: messages.map((message, index) => ({ Id: String(index), MessageBody: JSON.stringify(message) })),
    }), timeoutMilliseconds)).catch((error: unknown) => {
      reportUnexpectedError(error, ApplicationErrorCode.SQS_JOB_FAILED);
      throw error;
    });
    return messages.map((message, index) => {
      const id = String(index);
      const successes = response.Successful?.filter((entry) => entry.Id === id) ?? [];
      const successful = successes[0];
      if (successes.length !== 1 || !successful?.MessageId || response.Failed?.some((entry) => entry.Id === id)) {
        return { jobId: message.jobId, outcome: "FAILED" };
      }
      logger.log("info", LOG_EVENTS.JOB_PUBLISHED, {
        requestId: message.requestId, batchId: message.batchId, jobId: message.jobId,
        queueMessageId: successful.MessageId, durationMs: performance.now() - startedAt,
      });
      return { jobId: message.jobId, outcome: "PUBLISHED", messageId: successful.MessageId };
    });
  }

  public async publish(
    message: WorkerMessage,
  ): Promise<ProcessingQueuePublishResult> {
    const startedAt = performance.now();
    try {
      const response = await measureStage(PerformanceStage.SQS_PUBLICATION, () => this.sendMessage(
        new SendMessageCommand({
          MessageBody: JSON.stringify(message),
          QueueUrl: this.queueUrl,
        }),
      ));
      if (!response.MessageId) {
        throw new Error(PROCESSING_QUEUE_MESSAGE_MISSING_ID_ERROR);
      }
      logger.log("info", LOG_EVENTS.JOB_PUBLISHED, {
        requestId: message.requestId,
        batchId: message.batchId,
        jobId: message.jobId,
        queueMessageId: response.MessageId,
        durationMs: performance.now() - startedAt,
      });
      return { messageId: response.MessageId };
    } catch (error) {
      monitoringContext.run(
        {
          ...monitoringContext.getStore(),
          requestId: message.requestId,
          batchId: message.batchId,
          jobId: message.jobId,
        },
        () => reportUnexpectedError(error, ApplicationErrorCode.SQS_JOB_FAILED),
      );
      throw error;
    }
  }
}
