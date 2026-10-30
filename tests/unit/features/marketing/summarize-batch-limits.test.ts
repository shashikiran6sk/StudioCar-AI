import { describe, expect, it } from "vitest";

import { summarizeBatchLimits } from "../../../../apps/web/src/features/marketing/summarize-batch-limits";
import { DEFAULT_PLAN_CATALOG } from "../../../../apps/web/src/server/plans/default-plan-catalog";

describe("summarizeBatchLimits", () => {
  it("reads the free and largest paid batch from the seeded catalog", () => {
    expect(summarizeBatchLimits(DEFAULT_PLAN_CATALOG)).toEqual({
      free: 5,
      paid: 20,
    });
  });

  it("follows an administrator's edit instead of a shipped number", () => {
    const edited = DEFAULT_PLAN_CATALOG.map((plan) =>
      plan.planKey === "FREE" ? { ...plan, maxImagesPerBatch: 7 } : plan,
    );
    expect(summarizeBatchLimits(edited).free).toBe(7);
  });

  it("ignores plans that are not on offer", () => {
    const withdrawn = DEFAULT_PLAN_CATALOG.map((plan) =>
      plan.priceMinorUnits > 0 ? { ...plan, active: false } : plan,
    );
    expect(summarizeBatchLimits(withdrawn)).toEqual({ free: 5, paid: null });
    expect(summarizeBatchLimits([])).toEqual({ free: null, paid: null });
  });
});
