import { describe, expect, it } from "vitest";

import { dashboardPeriodStart } from "../../../../apps/web/src/server/dashboard/dashboard-period-start";

describe("dashboardPeriodStart", () => {
  it("returns the start of the UTC usage period", () => {
    expect(
      dashboardPeriodStart(new Date("2026-09-30T23:30:00.000Z")),
    ).toEqual(new Date("2026-09-01T00:00:00.000Z"));
  });
});
