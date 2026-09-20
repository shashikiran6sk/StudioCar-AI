import { describe, expect, it, vi } from "vitest";

import { EmailOutboxDispatcher } from "../../../packages/email/src/email-outbox-dispatcher";
import type {
  EmailOutboxRepositoryPort,
  EmailQueuePort,
} from "../../../packages/email/src/email.types";

const NOW = new Date("2026-09-20T12:00:00.000Z");
const MESSAGE_ID = "4bb7fa89-c907-4458-9786-8aafc2235728";
const VEHICLE_ID = "0e879f46-1193-4d77-b785-057fe026d998";
const CLAIM_TOKEN = "email-claim-token-0001";
const options = {
  applicationBaseUrl: "https://app.studiocar.example",
  batchSize: 20,
  claimTtlMilliseconds: 30_000,
  retryBaseMilliseconds: 1_000,
  retryMaximumMilliseconds: 60_000,
};

function createRepository(): EmailOutboxRepositoryPort {
  return {
    claimPendingOutbox: vi.fn().mockResolvedValue([
      {
        createdAt: NOW,
        id: MESSAGE_ID,
        publishAttemptCount: 1,
        recipient: "dealer@example.com",
        vehicleId: VEHICLE_ID,
        vehicleName: "Vehicle one",
      },
    ]),
    markOutboxPublished: vi.fn().mockResolvedValue(true),
    releaseOutboxClaim: vi.fn().mockResolvedValue(true),
  };
}

describe("EmailOutboxDispatcher", () => {
  it("publishes the canonical message and persists its queue acknowledgement", async () => {
    const repository = createRepository();
    const queue: EmailQueuePort = {
      publish: vi.fn().mockResolvedValue({ messageId: "sqs-email-1" }),
    };
    const dispatcher = new EmailOutboxDispatcher(
      repository,
      queue,
      options,
      () => NOW,
      () => CLAIM_TOKEN,
      () => 0.5,
    );

    await expect(dispatcher.dispatch()).resolves.toEqual({
      claimed: 1,
      failed: 0,
      published: 1,
    });
    expect(queue.publish).toHaveBeenCalledWith({
      data: {
        portfolioUrl: `https://app.studiocar.example/inventory/${VEHICLE_ID}`,
        vehicleName: "Vehicle one",
      },
      messageId: MESSAGE_ID,
      recipient: "dealer@example.com",
      type: "PROCESSING_COMPLETED",
      version: 1,
    });
    expect(repository.markOutboxPublished).toHaveBeenCalledWith({
      claimToken: CLAIM_TOKEN,
      messageId: MESSAGE_ID,
      publishedAt: NOW,
      queueMessageId: "sqs-email-1",
    });
  });

  it("releases failed publishes with bounded retry scheduling", async () => {
    const repository = createRepository();
    const queue: EmailQueuePort = {
      publish: vi.fn().mockRejectedValue(new Error("temporary SQS failure")),
    };
    const dispatcher = new EmailOutboxDispatcher(
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
      errorCode: "EMAIL_QUEUE_PUBLISH_FAILED",
      messageId: MESSAGE_ID,
      nextAttemptAt: new Date("2026-09-20T12:00:00.500Z"),
    });
  });
});
