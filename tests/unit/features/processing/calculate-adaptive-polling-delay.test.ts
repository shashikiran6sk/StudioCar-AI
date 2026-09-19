import { describe, expect, it } from "vitest";

import { calculateAdaptivePollingDelay } from "../../../../apps/web/src/features/processing/calculate-adaptive-polling-delay";

describe("calculateAdaptivePollingDelay", () => {
  it.each([
    [0, 1_000],
    [9_999, 1_000],
    [10_000, 2_000],
    [29_999, 2_000],
    [30_000, 5_000],
    [119_999, 5_000],
    [120_000, 10_000],
  ])("uses the adaptive delay at %i milliseconds", (elapsed, expected) => {
    expect(calculateAdaptivePollingDelay([1_000], 1_000 + elapsed)).toBe(
      expected,
    );
  });

  it("uses the fastest due active job and returns null for no jobs", () => {
    expect(calculateAdaptivePollingDelay([0, 119_000], 120_000)).toBe(1_000);
    expect(calculateAdaptivePollingDelay([], 120_000)).toBeNull();
  });
});
