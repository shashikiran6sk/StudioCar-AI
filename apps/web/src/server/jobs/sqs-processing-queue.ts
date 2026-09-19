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
    const response = await this.sendMessage(
      new SendMessageCommand({
        MessageBody: JSON.stringify(message),
        QueueUrl: this.queueUrl,
      }),
    );
    if (!response.MessageId) {
      throw new Error(PROCESSING_QUEUE_MESSAGE_MISSING_ID_ERROR);
    }
    return { messageId: response.MessageId };
  }
}
