import { describe, expect, it } from "vitest";

import { UsageQuerySchema } from "../../../packages/contracts/src/usage";

describe("usage contracts", () => {
  it("accepts a canonical billing period", () => {
    expect(UsageQuerySchema.parse({ billingPeriodKey: "2026-09" })).toEqual({
      billingPeriodKey: "2026-09",
      limit: 24,
    });
  });

  it("rejects invalid month keys", () => {
    expect(
      UsageQuerySchema.safeParse({ billingPeriodKey: "2026-13" }).success,
    ).toBe(false);
  });
});
