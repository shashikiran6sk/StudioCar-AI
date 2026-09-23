import { describe, expect, it } from "vitest";

import { DEFAULT_PLAN_CATALOG } from "../../../../apps/web/src/server/plans/default-plan-catalog";
import { findLargestBatch } from "../../../../apps/web/src/server/plans/find-largest-batch";

describe("findLargestBatch", () => {
  it("finds the largest batch any offered plan allows", () => {
    expect(findLargestBatch(DEFAULT_PLAN_CATALOG)).toBe(20);
  });

  it("ignores a plan that is not on offer", () => {
    // Nobody should be invited to upgrade to a plan they cannot choose.
    const catalog = DEFAULT_PLAN_CATALOG.map((plan) =>
      plan.planKey === "FREE"
        ? plan
        : {
            ...plan,
            active: plan.planKey !== "STUDIO_PLUS",
            maxImagesPerBatch:
              plan.planKey === "STUDIO_PLUS" ? 50 : plan.maxImagesPerBatch,
          },
    );

    expect(findLargestBatch(catalog)).toBe(20);
  });

  it("reports nothing when nothing is on offer", () => {
    expect(
      findLargestBatch(
        DEFAULT_PLAN_CATALOG.map((plan) => ({ ...plan, active: false })),
      ),
    ).toBeNull();
    expect(findLargestBatch([])).toBeNull();
  });
});
