import { describe, expect, it } from "vitest";

import { WorkerMessageSchema } from "../../../packages/contracts/src/worker";

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
});
