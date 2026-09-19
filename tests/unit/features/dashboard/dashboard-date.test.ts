import { describe, expect, it } from "vitest";

import { dashboardDate } from "../../../../apps/web/src/features/dashboard/dashboard-date";

describe("dashboardDate", () => {
  it("uses the product's readable Indian date format", () => {
    expect(dashboardDate(new Date(2026, 8, 19, 12))).toBe(
      "Saturday, 19 September",
    );
  });
});
