import { describe, expect, it } from "vitest";

import { getPlanActionHref } from "../../../../apps/web/src/features/pricing/get-plan-action-href";
import { FALLBACK_PLAN_ENTRY } from "../../../../apps/web/src/server/plans/default-plan-catalog";

describe("getPlanActionHref", () => {
  it("starts the free plan in the workspace", () => {
    expect(getPlanActionHref(FALLBACK_PLAN_ENTRY)).toBe(
      "/login?returnTo=%2Fdashboard",
    );
  });

  it.each(["ONE_TIME", "MONTHLY"] as const)(
    "sends a paid %s plan to the Billing packs after sign-in",
    (billingInterval) => {
      expect(
        getPlanActionHref({
          ...FALLBACK_PLAN_ENTRY,
          billingInterval,
          priceMinorUnits: 149_900,
        }),
      ).toBe("/login?returnTo=%2Fsettings%2Fbilling%23packs");
    },
  );
});
