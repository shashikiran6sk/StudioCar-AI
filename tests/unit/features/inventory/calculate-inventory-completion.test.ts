import { describe, expect, it } from "vitest";

import { calculateInventoryCompletion } from "../../../../apps/web/src/features/inventory/calculate-inventory-completion";

describe("calculateInventoryCompletion", () => {
  it("derives truthful batch completion from completed image jobs", () => {
    expect(calculateInventoryCompletion(13, 20)).toBe(65);
    expect(calculateInventoryCompletion(0, 0)).toBe(0);
  });
});
