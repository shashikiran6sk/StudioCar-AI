import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BillingPlanCard } from "../../../../apps/web/src/features/billing/billing-plan-card";
import { findPricingPlan } from "../../../../apps/web/src/features/pricing/find-pricing-plan";

describe("BillingPlanCard", () => {
  it("disables the active plan action", () => {
    render(<BillingPlanCard current plan={findPricingPlan("FREE")} />);
    expect(screen.getByRole("button", { name: "Current plan" })).toBeDisabled();
  });
});
