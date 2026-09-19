import { describe, expect, it } from "vitest";

import { calculateProcessingOutboxRetryDelay } from "../../../packages/processing/src/calculate-processing-outbox-retry-delay";

describe("calculateProcessingOutboxRetryDelay", () => {
  it("applies bounded exponential backoff with jitter", () => {
    expect(calculateProcessingOutboxRetryDelay(1, 1_000, 10_000, 0)).toBe(
      500,
    );
    expect(calculateProcessingOutboxRetryDelay(3, 1_000, 10_000, 1)).toBe(
      4_000,
    );
    expect(calculateProcessingOutboxRetryDelay(10, 1_000, 10_000, 1)).toBe(
      10_000,
    );
  });

  it("rejects invalid attempts and random values", () => {
    expect(() =>
      calculateProcessingOutboxRetryDelay(0, 1_000, 10_000, 0.5),
    ).toThrow(RangeError);
    expect(() =>
      calculateProcessingOutboxRetryDelay(1, 1_000, 10_000, 2),
    ).toThrow(RangeError);
  });
});
