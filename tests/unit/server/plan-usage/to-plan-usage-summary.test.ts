import { describe, expect, it } from "vitest";

import { toPlanUsageSummary } from "../../../../apps/web/src/server/plan-usage/to-plan-usage-summary";

describe("toPlanUsageSummary", () => {
  it("reduces the billing summary to what the sidebar renders", () => {
    expect(
      toPlanUsageSummary({
        currentPlan: {
          description: "For individuals trying the StudioCar workflow.",
          imageCapacity: 15,
          key: "FREE",
          name: "Free",
          storageCapacityBytes: 3_221_225_472,
          uploadSessionCapacity: 3,
        },
        imagesRemaining: 7,
        imagesUsed: 8,
        storageUsedBytes: 1_288_490_188,
        uploadSessionsRemaining: 1,
        uploadSessionsUsed: 2,
      }),
    ).toEqual({
      planKey: "FREE",
      planName: "Free",
      imagesUsed: 8,
      imageCapacity: 15,
      storageUsedBytes: 1_288_490_188,
      storageCapacityBytes: 3_221_225_472,
    });
  });

  it("carries an absent storage allowance through unchanged", () => {
    expect(
      toPlanUsageSummary({
        currentPlan: {
          description: "A flexible credit pack.",
          imageCapacity: 100,
          key: "STUDIO_PACK",
          name: "Studio Pack",
          storageCapacityBytes: null,
          uploadSessionCapacity: null,
        },
        imagesRemaining: 100,
        imagesUsed: 0,
        storageUsedBytes: 0,
        uploadSessionsRemaining: null,
        uploadSessionsUsed: 0,
      }).storageCapacityBytes,
    ).toBeNull();
  });
});
