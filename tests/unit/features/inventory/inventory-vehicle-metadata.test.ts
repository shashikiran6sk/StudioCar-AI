import { describe, expect, it } from "vitest";

import { inventoryVehicleMetadata } from "../../../../apps/web/src/features/inventory/inventory-vehicle-metadata";

describe("inventoryVehicleMetadata", () => {
  it("joins only available vehicle details", () => {
    expect(
      inventoryVehicleMetadata({ brand: "BMW", model: "3 Series", year: 2026 }),
    ).toBe("BMW · 3 Series · 2026");
    expect(
      inventoryVehicleMetadata({ brand: null, model: "Q5", year: null }),
    ).toBe("Q5");
  });
});
