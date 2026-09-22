import { describe, expect, it } from "vitest";

import { PlanCatalogEntrySchema } from "../../../../packages/contracts/src/plans";
import {
  DEFAULT_PLAN_CATALOG,
  FALLBACK_PLAN_ENTRY,
} from "../../../../apps/web/src/server/plans/default-plan-catalog";
import { DEFAULT_PLAN_CONFIGURATIONS } from "../../../../apps/web/src/server/plans/default-plan-configurations";

describe("DEFAULT_PLAN_CATALOG", () => {
  it("describes every plan the product ships", () => {
    expect(DEFAULT_PLAN_CATALOG.map((plan) => plan.planKey)).toEqual(
      DEFAULT_PLAN_CONFIGURATIONS.map((plan) => plan.planKey),
    );
  });

  it("satisfies the contract the database is validated against", () => {
    for (const plan of DEFAULT_PLAN_CATALOG) {
      expect(PlanCatalogEntrySchema.safeParse(plan).success).toBe(true);
    }
  });

  it("falls back to the free plan, which is the smallest allowance", () => {
    expect(FALLBACK_PLAN_ENTRY.planKey).toBe("FREE");
    for (const plan of DEFAULT_PLAN_CATALOG) {
      expect(plan.includedImages).toBeGreaterThanOrEqual(
        FALLBACK_PLAN_ENTRY.includedImages,
      );
    }
  });

  it("advertises no checkout while the billing provider is unimplemented", () => {
    expect(DEFAULT_PLAN_CATALOG.every((plan) => !plan.purchasable)).toBe(true);
  });
});
