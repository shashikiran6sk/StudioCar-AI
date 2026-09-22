import { describe, expect, it } from "vitest";

import { findPricingPlan } from "../../../../apps/web/src/features/pricing/find-pricing-plan";

describe("findPricingPlan", () => {
  it("returns the canonical plan configuration", () => {
    expect(findPricingPlan("FREE")).toMatchObject({
      imageCapacity: 15,
      name: "Free",
      uploadSessionCapacity: null,
    });
  });
});
