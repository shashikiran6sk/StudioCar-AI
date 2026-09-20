import { describe, expect, it } from "vitest";

import { formatDashboardCount } from "../../../../apps/web/src/features/dashboard/format-dashboard-count";

describe("formatDashboardCount", () => {
  it("uses Indian digit grouping", () => {
    expect(formatDashboardCount(123_456)).toBe("1,23,456");
  });
});
