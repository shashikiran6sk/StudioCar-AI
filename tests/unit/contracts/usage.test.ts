import { describe, expect, it } from "vitest";

import {
  UsageBillingSummarySchema,
  UsageQuerySchema,
} from "../../../packages/contracts/src/usage";

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

  it("validates a canonical usage and plan summary", () => {
    expect(
      UsageBillingSummarySchema.safeParse({
        currentPlan: {
          description: "Free plan",
          imageCapacity: 9,
          key: "FREE",
          name: "Free",
          storageCapacityBytes: 3_221_225_472,
          uploadSessionCapacity: 3,
        },
        imagesRemaining: 7,
        imagesUsed: 2,
        storageUsedBytes: 1_024,
        uploadSessionsRemaining: 2,
        uploadSessionsUsed: 1,
      }).success,
    ).toBe(true);
  });
});
