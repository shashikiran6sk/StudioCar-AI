import { describe, expect, it, vi } from "vitest";

import { ProcessingOutboxDispatcher } from "../../../packages/processing/src/processing-outbox-dispatcher";
import type {
  ProcessingOutboxRepositoryPort,
  ProcessingQueuePort,
} from "../../../packages/processing/src/processing-outbox.types";

const NOW = new Date("2026-09-19T12:00:00.000Z");
const JOB_ID = "0e879f46-1193-4d77-b785-057fe026d998";
const MESSAGE_ID = "8c879f46-1193-4d77-b785-057fe026d111";
const CLAIM_TOKEN = "claim-token-0001";
const options = {
  batchSize: 20,
  claimTtlMilliseconds: 30_000,
  retryBaseMilliseconds: 1_000,
  retryMaximumMilliseconds: 60_000,
};

function createRepository(): ProcessingOutboxRepositoryPort {
  return {
    claimPendingOutbox: vi.fn().mockResolvedValue([
      {
        id: MESSAGE_ID,
        jobId: JOB_ID,
        attemptCount: 1,
        createdAt: NOW,
      },
    ]),
    markOutboxPublished: vi.fn().mockResolvedValue(true),
    releaseOutboxClaim: vi.fn().mockResolvedValue(true),
  };
}

describe("ProcessingOutboxDispatcher", () => {
  it("publishes a claimed canonical worker message and marks the job queued", async () => {
    const repository = createRepository();
    const queue: ProcessingQueuePort = {
      publish: vi.fn().mockResolvedValue({ messageId: "sqs-message-1" }),
    };
    const dispatcher = new ProcessingOutboxDispatcher(
      repository,
      queue,
      options,
      () => NOW,
      () => CLAIM_TOKEN,
      () => 0.5,
    );

    await expect(dispatcher.dispatch({ jobIds: [JOB_ID] })).resolves.toEqual({
      claimed: 1,
      failed: 0,
      published: 1,
    });
    expect(queue.publish).toHaveBeenCalledWith({
      version: 1,
      type: "PROCESS_IMAGE",
      jobId: JOB_ID,
      requestId: JOB_ID,
      enqueuedAt: NOW.toISOString(),
    });
    expect(repository.markOutboxPublished).toHaveBeenCalledWith({
      claimToken: CLAIM_TOKEN,
      messageId: MESSAGE_ID,
      publishedAt: NOW,
      queueMessageId: "sqs-message-1",
    });
  });

  it("releases failed publishes with a bounded retry time", async () => {
    const repository = createRepository();
    const queue: ProcessingQueuePort = {
      publish: vi.fn().mockRejectedValue(new Error("temporary SQS failure")),
    };
    const dispatcher = new ProcessingOutboxDispatcher(
      repository,
      queue,
      options,
      () => NOW,
      () => CLAIM_TOKEN,
      () => 0,
    );

    await expect(dispatcher.dispatch()).resolves.toEqual({
      claimed: 1,
      failed: 1,
      published: 0,
    });
    expect(repository.releaseOutboxClaim).toHaveBeenCalledWith({
      claimToken: CLAIM_TOKEN,
      errorCode: "QUEUE_PUBLISH_FAILED",
      messageId: MESSAGE_ID,
      nextAttemptAt: new Date("2026-09-19T12:00:00.500Z"),
    });
  });
});

it("uses persisted request and batch IDs during scheduler recovery", async () => {
  const repository = createRepository();
  repository.claimPendingOutbox = vi.fn().mockResolvedValue([
    {
      id: MESSAGE_ID,
      jobId: JOB_ID,
      attemptCount: 2,
      createdAt: NOW,
      job: { requestId: MESSAGE_ID, batchIdempotencyKey: "batch-1234567890" },
    },
  ]);
  const queue = {
    publish: vi.fn().mockResolvedValue({ messageId: "sqs-123" }),
  };
  await new ProcessingOutboxDispatcher(
    repository,
    queue,
    options,
    () => NOW,
  ).dispatch();
  expect(queue.publish).toHaveBeenCalledWith(
    expect.objectContaining({
      requestId: MESSAGE_ID,
      batchId: "batch-1234567890",
      jobId: JOB_ID,
    }),
  );
});
