import { describe, expect, it } from "vitest";

import {
  DEFAULT_PLAN_CATALOG,
  FALLBACK_PLAN_ENTRY,
} from "../../../../apps/web/src/server/plans/default-plan-catalog";
import { describePlanAction } from "../../../../apps/web/src/server/plans/describe-plan-action";

describe("describePlanAction", () => {
  it("invites somebody to start on a plan that costs nothing", () => {
    expect(describePlanAction(FALLBACK_PLAN_ENTRY)).toBe("Start free");
  });

  it("names the plan on a paid card", () => {
    const pro = DEFAULT_PLAN_CATALOG.find(
      (plan) => plan.planKey === "STUDIO_PLUS",
    );
    expect(pro && describePlanAction(pro)).toBe("Choose StudioCar Plus");
  });

  it("follows a renamed plan", () => {
    expect(
      describePlanAction({ ...FALLBACK_PLAN_ENTRY, displayName: "Starter", priceMinorUnits: 100 }),
    ).toBe("Choose Starter");
  });
});
