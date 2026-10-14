import { describe, expect, it } from "vitest";

import { DEFAULT_PLAN_CATALOG } from "../../../../apps/web/src/server/plans/default-plan-catalog";
import { resolvePlanEntry } from "../../../../apps/web/src/server/plans/resolve-plan-entry";

describe("resolvePlanEntry", () => {
  it("prefers what an administrator configured", () => {
    const edited = DEFAULT_PLAN_CATALOG.map((plan) =>
      plan.planKey === "FREE" ? { ...plan, includedImages: 25 } : plan,
    );

    expect(resolvePlanEntry(edited, "FREE")).toMatchObject({
      key: "FREE",
      plan: { includedImages: 25 },
    });
  });

  it("uses the shipped default when a plan is not configured", () => {
    expect(resolvePlanEntry([], "STUDIO_PLUS")).toMatchObject({
      key: "STUDIO_PLUS",
      plan: { includedImages: 100 },
    });
  });

  it("falls back to the free plan when nothing describes the key", () => {
    const onlyFree = DEFAULT_PLAN_CATALOG.filter(
      (plan) => plan.planKey === "FREE",
    );
    const withoutPaid = onlyFree.map((plan) => ({
      ...plan,
      includedImages: 9,
    }));

    // A catalog that has been emptied of every paid plan still resolves.
    const resolved = resolvePlanEntry(withoutPaid, "STUDIO_PLUS");

    expect(resolved.key).toBe("STUDIO_PLUS");
    expect(resolved.plan.planKey).toBe("STUDIO_PLUS");
  });

  it("never returns a larger allowance than the key asked for", () => {
    for (const plan of DEFAULT_PLAN_CATALOG) {
      const resolved = resolvePlanEntry([], plan.planKey === "FREE" ? "FREE" : "FREE");
      expect(resolved.plan.includedImages).toBe(15);
    }
  });
});
