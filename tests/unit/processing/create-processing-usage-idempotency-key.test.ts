import { describe, expect, it } from "vitest";

import { createProcessingUsageIdempotencyKey } from "../../../packages/processing/src/create-processing-usage-idempotency-key";

describe("createProcessingUsageIdempotencyKey", () => {
  it("creates a stable job-scoped usage key", () => {
    expect(createProcessingUsageIdempotencyKey("job-1")).toBe(
      "processing-job:job-1:background-removal-completed",
    );
  });
});
