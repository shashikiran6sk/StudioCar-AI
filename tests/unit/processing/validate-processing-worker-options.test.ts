import { describe, expect, it } from "vitest";

import { validateProcessingWorkerOptions } from "../../../packages/processing/src/validate-processing-worker-options";

describe("validateProcessingWorkerOptions", () => {
  it("accepts valid timings", () => {
    expect(() =>
      validateProcessingWorkerOptions({
        claimTtlMilliseconds: 30_000,
        retryBaseMilliseconds: 1_000,
        retryMaximumMilliseconds: 60_000,
      }),
    ).not.toThrow();
  });

  it("rejects invalid timings", () => {
    expect(() =>
      validateProcessingWorkerOptions({
        claimTtlMilliseconds: 30_000,
        retryBaseMilliseconds: 2_000,
        retryMaximumMilliseconds: 1_000,
      }),
    ).toThrow(RangeError);
  });
});
