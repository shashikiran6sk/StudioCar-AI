import { VehicleStatus } from "../../../../packages/database-runtime/src";
import { describe, expect, it } from "vitest";

import { toPortfolioStatus } from "../../../../apps/web/src/server/portfolio/to-portfolio-status";

describe("toPortfolioStatus", () => {
  it.each([
    [VehicleStatus.PROCESSING, "PROCESSING"],
    [VehicleStatus.READY, "COMPLETED"],
    [VehicleStatus.PARTIALLY_FAILED, "NEEDS_ATTENTION"],
    [VehicleStatus.ARCHIVED, "ARCHIVED"],
  ])("maps %s to %s", (status, expected) => {
    expect(toPortfolioStatus(status)).toBe(expected);
  });

  it("rejects vehicles still in the creation workflow", () => {
    expect(() => toPortfolioStatus(VehicleStatus.DRAFT)).toThrow(
      "Vehicle is not available as a portfolio.",
    );
  });
});
