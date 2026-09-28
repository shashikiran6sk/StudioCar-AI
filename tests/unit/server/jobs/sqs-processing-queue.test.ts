import { SendMessageBatchCommand, SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
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

it("checks each batch entry even on HTTP success and refuses ambiguous acknowledgements", async () => {
  const sendBatch = vi.fn(async () => ({
    $metadata: { httpStatusCode: 200 },
    Successful: [ { Id: "0", MessageId: "sqs-ok", MD5OfMessageBody: "digest" },
      { Id: "2", MessageId: "duplicate-a", MD5OfMessageBody: "digest" },
      { Id: "2", MessageId: "duplicate-b", MD5OfMessageBody: "digest" } ],
    Failed: [{ Id: "1", Code: "Throttled", SenderFault: false }],
  }));
  const queue = new SqsProcessingQueue(createClient(), "https://sqs.test/local", undefined, sendBatch);
  const messages = Array.from({ length: 4 }, (_, index) => ({
    version: 1, type: "PROCESS_IMAGE", jobId: `job-${String(index)}`, enqueuedAt: "2026-09-28T00:00:00Z",
  } satisfies Parameters<SqsProcessingQueue["publish"]>[0]));
  expect(await queue.publishBatch(messages, 1000)).toEqual([
    { jobId: "job-0", outcome: "PUBLISHED", messageId: "sqs-ok" },
    { jobId: "job-1", outcome: "FAILED" }, { jobId: "job-2", outcome: "FAILED" }, { jobId: "job-3", outcome: "FAILED" },
  ]);
  expect(sendBatch).toHaveBeenCalledOnce();
  await expect(queue.publishBatch([], 1000)).rejects.toThrow();
  await expect(queue.publishBatch([...messages, ...messages, ...messages], 1000)).rejects.toThrow();
});


it("preserves worker payloads and forwards the remaining claim budget", async () => {
  const client = createClient();
  const send = vi.fn(async (_command: SendMessageBatchCommand, _timeoutMilliseconds: number) => ({
    $metadata: {}, Successful: [{ Id: "0", MessageId: "accepted", MD5OfMessageBody: "digest" }], Failed: [],
  }));
  const message = { version: 1, type: "PROCESS_IMAGE", jobId: "job", requestId: "request",
    batchId: "batch", enqueuedAt: "2026-09-28T00:00:00Z" } satisfies Parameters<SqsProcessingQueue["publish"]>[0];
  const queue = new SqsProcessingQueue(client, "https://sqs.test/local", undefined, send);
  await expect(queue.publishBatch([message], 1000)).resolves.toEqual([{ jobId: "job", outcome: "PUBLISHED", messageId: "accepted" }]);
  expect(send).toHaveBeenCalledWith(expect.any(SendMessageBatchCommand), 1000);
  const command = send.mock.calls[0]?.[0];
  if (!(command instanceof SendMessageBatchCommand)) throw new Error("Expected batch command");
  expect(command.input).toEqual({ QueueUrl: "https://sqs.test/local", Entries: [{ Id: "0", MessageBody: JSON.stringify(message) }] });
});
