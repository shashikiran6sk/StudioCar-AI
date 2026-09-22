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
    expect(resolvePlanEntry([], "STUDIO_PRO")).toMatchObject({
      key: "STUDIO_PRO",
      plan: { includedImages: 500 },
    });
  });

  it("falls back to the free plan when nothing describes the key", () => {
    const onlyFree = DEFAULT_PLAN_CATALOG.filter(
      (plan) => plan.planKey === "FREE",
    );
    const withoutPro = onlyFree.map((plan) => ({
      ...plan,
      includedImages: 9,
    }));

    // A catalog that has been emptied of every paid plan still resolves.
    const resolved = resolvePlanEntry(withoutPro, "STUDIO_PACK");

    expect(resolved.key).toBe("STUDIO_PACK");
    expect(resolved.plan.planKey).toBe("STUDIO_PACK");
  });

  it("never returns a larger allowance than the key asked for", () => {
    for (const plan of DEFAULT_PLAN_CATALOG) {
      const resolved = resolvePlanEntry([], plan.planKey === "FREE" ? "FREE" : "FREE");
      expect(resolved.plan.includedImages).toBe(15);
    }
  });
});
