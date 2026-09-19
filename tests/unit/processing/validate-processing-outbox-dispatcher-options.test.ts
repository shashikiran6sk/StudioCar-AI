import { describe, expect, it } from "vitest";

import { validateProcessingOutboxDispatcherOptions } from "../../../packages/processing/src/validate-processing-outbox-dispatcher-options";

describe("validateProcessingOutboxDispatcherOptions", () => {
  it("accepts bounded dispatcher settings", () => {
    expect(() =>
      validateProcessingOutboxDispatcherOptions({
        batchSize: 20,
        claimTtlMilliseconds: 30_000,
        retryBaseMilliseconds: 1_000,
        retryMaximumMilliseconds: 60_000,
      }),
    ).not.toThrow();
  });

  it("rejects unsafe batch and retry settings", () => {
    expect(() =>
      validateProcessingOutboxDispatcherOptions({
        batchSize: 101,
        claimTtlMilliseconds: 30_000,
        retryBaseMilliseconds: 1_000,
        retryMaximumMilliseconds: 60_000,
      }),
    ).toThrow(RangeError);
    expect(() =>
      validateProcessingOutboxDispatcherOptions({
        batchSize: 20,
        claimTtlMilliseconds: 30_000,
        retryBaseMilliseconds: 60_000,
        retryMaximumMilliseconds: 1_000,
      }),
    ).toThrow(RangeError);
  });
});
