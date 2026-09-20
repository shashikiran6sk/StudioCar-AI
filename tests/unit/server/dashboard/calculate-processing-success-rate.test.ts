import { describe, expect, it } from "vitest";

import { calculateProcessingSuccessRate } from "../../../../apps/web/src/server/dashboard/calculate-processing-success-rate";

describe("calculateProcessingSuccessRate", () => {
  it("returns null when no terminal jobs exist", () => {
    expect(calculateProcessingSuccessRate(0, 0)).toBeNull();
  });

  it("rounds the completed share of terminal jobs", () => {
    expect(calculateProcessingSuccessRate(19, 1)).toBe(95);
  });
});
