import { describe, expect, it } from "vitest";

import { createProcessingJobIdempotencyKey } from "../../../packages/processing/src/create-processing-job-idempotency-key";

describe("createProcessingJobIdempotencyKey", () => {
  it("derives a stable bounded key per batch asset", () => {
    const first = createProcessingJobIdempotencyKey(
      "processing-batch-1",
      "331a1e25-b9d8-4b1a-a398-8351a58f8c24",
    );
    const replay = createProcessingJobIdempotencyKey(
      "processing-batch-1",
      "331a1e25-b9d8-4b1a-a398-8351a58f8c24",
    );

    expect(first).toHaveLength(64);
    expect(replay).toBe(first);
  });
});
