import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SqsEmailQueue } from "../../../../apps/web/src/server/email/sqs-email-queue";

const clients: SQSClient[] = [];

afterEach(() => {
  clients.forEach((client) => client.destroy());
  clients.length = 0;
});

function createClient(): SQSClient {
  const client = new SQSClient({
    region: "ap-south-1",
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
  });
  clients.push(client);
  return client;
}

const message = {
  data: {
    portfolioUrl: "https://app.studiocar.example/inventory/vehicle-1",
    vehicleName: "Vehicle one",
  },
  messageId: "4bb7fa89-c907-4458-9786-8aafc2235728",
  recipient: "dealer@example.com",
  type: "PROCESSING_COMPLETED",
  version: 1,
} satisfies Parameters<SqsEmailQueue["publish"]>[0];

describe("SqsEmailQueue", () => {
  it("publishes the stable email contract to its independent queue", async () => {
    const client = createClient();
    const send = vi.fn(async (_command: SendMessageCommand) => ({
      MessageId: "sqs-email-1",
      $metadata: {},
    }));
    const queue = new SqsEmailQueue(
      client,
      "https://sqs.ap-south-1.amazonaws.com/123/email",
      send,
    );

    await expect(queue.publish(message)).resolves.toEqual({
      messageId: "sqs-email-1",
    });
    expect(send.mock.calls[0]?.[0].input).toEqual({
      MessageBody: JSON.stringify(message),
      QueueUrl: "https://sqs.ap-south-1.amazonaws.com/123/email",
    });
  });

  it("rejects an ambiguous SQS acknowledgement", async () => {
    const queue = new SqsEmailQueue(
      createClient(),
      "https://sqs.ap-south-1.amazonaws.com/123/email",
      vi.fn(async (_command: SendMessageCommand) => ({ $metadata: {} })),
    );

    await expect(queue.publish(message)).rejects.toThrow(
      "without returning a message ID",
    );
  });
});
