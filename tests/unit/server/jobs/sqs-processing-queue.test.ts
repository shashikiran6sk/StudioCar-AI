import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SqsProcessingQueue } from "../../../../apps/web/src/server/jobs/sqs-processing-queue";

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

describe("SqsProcessingQueue", () => {
  it("publishes the stable worker contract to the private queue", async () => {
    const client = createClient();
    const send = vi.fn(async (_command: SendMessageCommand) => ({
      MessageId: "sqs-message-1",
      $metadata: {},
    }));
    const queue = new SqsProcessingQueue(
      client,
      "https://sqs.ap-south-1.amazonaws.com/123/images",
      send,
    );
    const message = {
      version: 1,
      type: "PROCESS_IMAGE",
      jobId: "0e879f46-1193-4d77-b785-057fe026d998",
      enqueuedAt: "2026-09-19T12:00:00.000Z",
    } satisfies Parameters<SqsProcessingQueue["publish"]>[0];

    await expect(queue.publish(message)).resolves.toEqual({
      messageId: "sqs-message-1",
    });
    expect(send).toHaveBeenCalledOnce();
    expect(send.mock.calls[0]?.[0].input).toEqual({
      MessageBody: JSON.stringify(message),
      QueueUrl: "https://sqs.ap-south-1.amazonaws.com/123/images",
    });
  });

  it("rejects an ambiguous SQS acknowledgement", async () => {
    const client = createClient();
    const send = vi.fn(async (_command: SendMessageCommand) => ({
      $metadata: {},
    }));
    const queue = new SqsProcessingQueue(
      client,
      "https://sqs.ap-south-1.amazonaws.com/123/images",
      send,
    );

    await expect(
      queue.publish({
        version: 1,
        type: "PROCESS_IMAGE",
        jobId: "0e879f46-1193-4d77-b785-057fe026d998",
        enqueuedAt: "2026-09-19T12:00:00.000Z",
      }),
    ).rejects.toThrow("without returning a message ID");
  });
});
