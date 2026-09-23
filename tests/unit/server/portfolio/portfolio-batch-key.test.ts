import { describe, expect, it } from "vitest";

import { portfolioBatchKey } from "../../../../apps/web/src/server/portfolio/portfolio-batch-key";

describe("portfolioBatchKey", () => {
  it("identifies a batch by its idempotency key", () => {
    expect(portfolioBatchKey({ batchIdempotencyKey: "batch-1", id: "job-1" })).toBe(
      "batch-1",
    );
  });

  it("treats a job from before batch keys as its own batch", () => {
    expect(portfolioBatchKey({ batchIdempotencyKey: null, id: "job-1" })).toBe("job-1");
  });
});
