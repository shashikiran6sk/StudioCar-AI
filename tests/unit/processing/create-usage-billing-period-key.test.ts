import { describe, expect, it } from "vitest";

import { createUsageBillingPeriodKey } from "../../../packages/processing/src/create-usage-billing-period-key";

describe("createUsageBillingPeriodKey", () => {
  it("uses the UTC calendar month", () => {
    expect(
      createUsageBillingPeriodKey(new Date("2027-01-01T00:15:00.000+05:30")),
    ).toBe("2026-12");
  });
});
