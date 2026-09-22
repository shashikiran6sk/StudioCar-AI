import { describe, expect, it } from "vitest";

import { calculateSubscriptionPeriodEnd } from "../../../../apps/web/src/server/admin/calculate-subscription-period-end";

describe("calculateSubscriptionPeriodEnd", () => {
  it("adds whole months", () => {
    expect(
      calculateSubscriptionPeriodEnd(
        new Date("2026-09-22T10:00:00.000Z"),
        3,
      ).toISOString(),
    ).toBe("2026-12-22T10:00:00.000Z");
  });

  it("does not roll into the next month when the day does not exist", () => {
    // 31 January plus one month is 28 February, never 3 March.
    expect(
      calculateSubscriptionPeriodEnd(
        new Date("2027-01-31T10:00:00.000Z"),
        1,
      ).toISOString(),
    ).toBe("2027-02-28T10:00:00.000Z");
  });

  it("uses the real length of a leap February", () => {
    expect(
      calculateSubscriptionPeriodEnd(
        new Date("2028-01-31T10:00:00.000Z"),
        1,
      ).toISOString(),
    ).toBe("2028-02-29T10:00:00.000Z");
  });

  it("crosses a year boundary", () => {
    expect(
      calculateSubscriptionPeriodEnd(
        new Date("2026-11-15T10:00:00.000Z"),
        12,
      ).toISOString(),
    ).toBe("2027-11-15T10:00:00.000Z");
  });

  it("always ends after it starts", () => {
    const start = new Date("2026-09-22T10:00:00.000Z");
    for (let months = 1; months <= 24; months += 1) {
      expect(
        calculateSubscriptionPeriodEnd(start, months).getTime(),
      ).toBeGreaterThan(start.getTime());
    }
  });
});
