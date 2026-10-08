import { describe, expect, it } from "vitest";

import { PlanKeySchema } from "../../../packages/contracts/src/usage";
import { PLAN_PROCESSING_QUALITY_TIERS } from "../../../packages/processing/src/processing-quality-tier.constants";
import { resolveProcessingQualityTier } from "../../../packages/processing/src/resolve-processing-quality-tier";

describe("resolveProcessingQualityTier", () => {
  it("gives the free plan the standard (preview) tier", () => {
    expect(resolveProcessingQualityTier("FREE")).toBe("STANDARD");
  });

  it.each(["STUDIO_PLUS"])(
    "gives the paid plan %s the high (full resolution) tier",
    (planKey) => {
      expect(resolveProcessingQualityTier(planKey)).toBe("HIGH");
    },
  );

  it.each<[string | null, string]>([
    [null, "no purchase history"],
    ["RETIRED_STUDIO_PLUS", "a retired plan"],
    ["studio_pro", "a key in the wrong case"],
    ["", "an empty key"],
    ["ENTERPRISE", "an unknown plan"],
  ])("falls back to the standard tier for %s (%s)", (planKey) => {
    expect(resolveProcessingQualityTier(planKey)).toBe("STANDARD");
  });

  it("decides a tier for every plan the catalog can hold", () => {
    expect(Object.keys(PLAN_PROCESSING_QUALITY_TIERS).sort()).toEqual(
      [...PlanKeySchema.options].sort(),
    );
  });
});
