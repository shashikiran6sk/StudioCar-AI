import { describe, expect, it } from "vitest";

import { formatPortfolioDate } from "../../../../apps/web/src/features/portfolio/format-portfolio-date";

describe("formatPortfolioDate", () => {
  it("formats completion dates consistently in UTC", () => {
    expect(formatPortfolioDate("2026-09-19T23:30:00.000Z")).toBe("Sep 19, 2026");
  });
});
