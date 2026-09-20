import { describe, expect, it, vi } from "vitest";

import { handleEmailQueueEvent } from "../../../../workers/email-delivery/src/handle-email-queue-event";

const MESSAGE = JSON.stringify({
  data: {
    portfolioUrl: "https://studiocar.example/inventory/vehicle-1",
    vehicleName: "Vehicle one",
  },
  messageId: "4bb7fa89-c907-4458-9786-8aafc2235728",
  recipient: "dealer@example.com",
  type: "PROCESSING_COMPLETED",
  version: 1,
});

describe("handleEmailQueueEvent", () => {
  it("reports only retryable records as SQS batch failures", async () => {
    const process = vi
      .fn()
      .mockResolvedValueOnce("RETRY")
      .mockResolvedValueOnce("ACKNOWLEDGED");

    await expect(
      handleEmailQueueEvent(
        {
          Records: [
            { body: MESSAGE, messageId: "sqs-1" },
            { body: MESSAGE, messageId: "sqs-2" },
          ],
        },
        { process },
      ),
    ).resolves.toEqual({ batchItemFailures: [{ itemIdentifier: "sqs-1" }] });
  });

  it("returns malformed messages to SQS for bounded retry and DLQ", async () => {
    await expect(
      handleEmailQueueEvent(
        { Records: [{ body: "not-json", messageId: "sqs-invalid" }] },
        { process: vi.fn() },
      ),
    ).resolves.toEqual({
      batchItemFailures: [{ itemIdentifier: "sqs-invalid" }],
    });
  });
});
