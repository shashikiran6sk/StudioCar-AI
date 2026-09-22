import { describe, expect, it } from "vitest";

import { PLAN_BILLING_INTERVAL_OPTIONS } from "../../../../apps/web/src/features/admin/plan-billing-interval-options";
import { PlanBillingIntervalSchema } from "../../../../packages/contracts/src/plans";

describe("PLAN_BILLING_INTERVAL_OPTIONS", () => {
  it("offers every interval the contract accepts and nothing else", () => {
    expect(PLAN_BILLING_INTERVAL_OPTIONS.map((option) => option.value)).toEqual(
      PlanBillingIntervalSchema.options,
    );
  });

  it("labels each option in words rather than in enum names", () => {
    for (const option of PLAN_BILLING_INTERVAL_OPTIONS) {
      expect(option.label).not.toBe(option.value);
    }
  });
});
