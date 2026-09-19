import { describe, expect, it } from "vitest";

import {
  SqsWorkerEventSchema,
  WorkerMessageSchema,
} from "../../../packages/contracts/src/worker";

describe("worker message contract", () => {
  it("accepts only the stable versioned image-processing envelope", () => {
    const baseMessage = {
      type: "PROCESS_IMAGE",
      jobId: "4f9d4891-157f-49ed-aa5a-c026abc0a768",
      enqueuedAt: "2026-09-18T10:30:00Z",
    };

    expect(WorkerMessageSchema.safeParse({ version: 1, ...baseMessage }).success).toBe(
      true,
    );
    expect(WorkerMessageSchema.safeParse({ version: 2, ...baseMessage }).success).toBe(
      false,
    );
  });

  it("validates and strips an AWS SQS event to the worker boundary", () => {
    const result = SqsWorkerEventSchema.parse({
      Records: [
        {
          messageId: "sqs-message-1",
          body: "{}",
          receiptHandle: "sensitive-transport-detail",
        },
      ],
    });

    expect(result).toEqual({
      Records: [{ messageId: "sqs-message-1", body: "{}" }],
    });
    expect(SqsWorkerEventSchema.safeParse({ Records: [] }).success).toBe(false);
  });
});
