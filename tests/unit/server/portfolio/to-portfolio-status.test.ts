import { VehicleStatus } from "../../../../packages/database/src/index";
import { describe, expect, it } from "vitest";

import { toPortfolioStatus } from "../../../../apps/web/src/server/portfolio/to-portfolio-status";

describe("toPortfolioStatus", () => {
  it.each([
    [VehicleStatus.READY, "COMPLETED"],
    [VehicleStatus.PARTIALLY_FAILED, "NEEDS_ATTENTION"],
    [VehicleStatus.ARCHIVED, "ARCHIVED"],
  ])("maps %s to %s", (status, expected) => {
    expect(toPortfolioStatus(status)).toBe(expected);
  });

  it("rejects unfinished vehicles", () => {
    expect(() => toPortfolioStatus(VehicleStatus.PROCESSING)).toThrow(
      "Vehicle is not available as a portfolio.",
    );
  });
});
