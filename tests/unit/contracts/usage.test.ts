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
          allowanceScope: "LIFETIME",
          description: "Free plan",
          imageCapacity: 15,
          key: "FREE",
          maxImagesPerBatch: 5,
          name: "Free",
          storageCapacityBytes: 3_221_225_472,
          uploadSessionCapacity: null,
        },
        imagesRemaining: 13,
        imagesUsed: 2,
        storageUsedBytes: 1_024,
        uploadSessionsRemaining: null,
        uploadSessionsUsed: 1,
      }).success,
    ).toBe(true);
  });
});
