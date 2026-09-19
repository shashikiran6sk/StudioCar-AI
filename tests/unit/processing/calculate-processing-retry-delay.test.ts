import { describe, expect, it } from "vitest";

import { calculateProcessingRetryDelay } from "../../../packages/processing/src/calculate-processing-retry-delay";

describe("calculateProcessingRetryDelay", () => {
  it("applies bounded exponential backoff with jitter", () => {
    expect(calculateProcessingRetryDelay(1, 1_000, 10_000, 0)).toBe(500);
    expect(calculateProcessingRetryDelay(3, 1_000, 10_000, 1)).toBe(4_000);
    expect(calculateProcessingRetryDelay(10, 1_000, 10_000, 1)).toBe(10_000);
  });

  it("rejects invalid bounds and jitter", () => {
    expect(() => calculateProcessingRetryDelay(0, 1_000, 10_000, 0)).toThrow(
      RangeError,
    );
    expect(() => calculateProcessingRetryDelay(1, 50, 10_000, 0)).toThrow(
      RangeError,
    );
    expect(() => calculateProcessingRetryDelay(1, 1_000, 500, 0)).toThrow(
      RangeError,
    );
    expect(() => calculateProcessingRetryDelay(1, 1_000, 10_000, 2)).toThrow(
      RangeError,
    );
  });
});
