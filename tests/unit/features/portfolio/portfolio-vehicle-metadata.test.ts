import { describe, expect, it } from "vitest";

import { portfolioVehicleMetadata } from "../../../../apps/web/src/features/portfolio/portfolio-vehicle-metadata";

describe("portfolioVehicleMetadata", () => {
  it("joins only available identity fields", () => {
    expect(
      portfolioVehicleMetadata({
        brand: "BMW",
        model: "3 Series",
        stockId: "NL-3429",
        variant: null,
      }),
    ).toBe("BMW · 3 Series · NL-3429");
  });
});
