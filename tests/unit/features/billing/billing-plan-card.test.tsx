import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BillingPlanCard } from "../../../../apps/web/src/features/billing/billing-plan-card";
import { FALLBACK_PLAN_ENTRY } from "../../../../apps/web/src/server/plans/default-plan-catalog";

describe("BillingPlanCard", () => {
  it("disables the active plan action", () => {
    render(<BillingPlanCard current plan={FALLBACK_PLAN_ENTRY} />);

    expect(screen.getByRole("button", { name: "Current plan" })).toBeDisabled();
  });

  it("offers a plan that is not in use", () => {
    render(<BillingPlanCard current={false} plan={FALLBACK_PLAN_ENTRY} />);

    expect(screen.getByRole("button", { name: "Start free" })).toBeEnabled();
  });
});
