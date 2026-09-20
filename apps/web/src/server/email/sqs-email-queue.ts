import {
  SendMessageCommand,
  SQSClient,
  type SendMessageCommandOutput,
} from "@aws-sdk/client-sqs";
import type { EmailWorkerMessage } from "@studiocar/contracts";
import type { EmailQueuePort, EmailQueuePublishResult } from "@studiocar/email";

import { EMAIL_QUEUE_MESSAGE_MISSING_ID_ERROR } from "./email-dispatch.constants";

type SendMessage = (
  command: SendMessageCommand,
) => Promise<SendMessageCommandOutput>;

export class SqsEmailQueue implements EmailQueuePort {
  public constructor(
    private readonly client: SQSClient,
    private readonly queueUrl: string,
    private readonly sendMessage: SendMessage = (command) =>
      this.client.send(command),
  ) {}

  public async publish(
    message: EmailWorkerMessage,
  ): Promise<EmailQueuePublishResult> {
    const response = await this.sendMessage(
      new SendMessageCommand({
        MessageBody: JSON.stringify(message),
        QueueUrl: this.queueUrl,
      }),
    );
    if (!response.MessageId) {
      throw new Error(EMAIL_QUEUE_MESSAGE_MISSING_ID_ERROR);
    }
    return { messageId: response.MessageId };
  }
}
