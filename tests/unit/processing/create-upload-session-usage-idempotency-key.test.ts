import { describe, expect, it } from "vitest";

import { createUploadSessionUsageIdempotencyKey } from "../../../packages/processing/src/create-upload-session-usage-idempotency-key";

describe("createUploadSessionUsageIdempotencyKey", () => {
  it("creates a stable key for one accepted batch", () => {
    expect(createUploadSessionUsageIdempotencyKey("batch-1")).toBe(
      "usage:upload-session:batch-1",
    );
  });
});
