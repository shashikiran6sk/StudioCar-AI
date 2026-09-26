import { LOG_EVENTS } from "@studiocar/observability";
import {
  ApplicationErrorCode,
  logger,
  monitoringContext,
  reportUnexpectedError,
} from "@studiocar/observability";
import {
  SendMessageCommand,
  SQSClient,
  type SendMessageCommandOutput,
} from "@aws-sdk/client-sqs";
import type {
  ProcessingQueuePort,
  ProcessingQueuePublishResult,
} from "@studiocar/processing";
import type { WorkerMessage } from "@studiocar/contracts";

import { PROCESSING_QUEUE_MESSAGE_MISSING_ID_ERROR } from "./processing-queue.constants";

type SendMessage = (
  command: SendMessageCommand,
) => Promise<SendMessageCommandOutput>;

export class SqsProcessingQueue implements ProcessingQueuePort {
  public constructor(
    private readonly client: SQSClient,
    private readonly queueUrl: string,
    private readonly sendMessage: SendMessage = (command) =>
      this.client.send(command),
  ) {}

  public async publish(
    message: WorkerMessage,
  ): Promise<ProcessingQueuePublishResult> {
    const startedAt = performance.now();
    try {
      const response = await this.sendMessage(
        new SendMessageCommand({
          MessageBody: JSON.stringify(message),
          QueueUrl: this.queueUrl,
        }),
      );
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
