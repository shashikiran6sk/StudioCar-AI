import { describe, expect, it } from "vitest";

import { createVehiclePortfolioPath } from "../../../../apps/web/src/features/portfolio/create-vehicle-portfolio-path";

describe("createVehiclePortfolioPath", () => {
  it("encodes the vehicle identifier below inventory", () => {
    expect(createVehiclePortfolioPath("vehicle/one")).toBe("/inventory/vehicle%2Fone");
  });
});
