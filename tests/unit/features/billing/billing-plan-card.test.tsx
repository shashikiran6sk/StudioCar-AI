import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BillingPlanCard } from "../../../../apps/web/src/features/billing/billing-plan-card";
import { DEFAULT_PLAN_CATALOG, FALLBACK_PLAN_ENTRY } from "../../../../apps/web/src/server/plans/default-plan-catalog";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

describe("BillingPlanCard", () => {
  it("disables the active plan action", () => {
    render(<BillingPlanCard current plan={FALLBACK_PLAN_ENTRY} />);

    expect(screen.getByRole("button", { name: "Current plan" })).toBeDisabled();
  });

  it("offers a plan that is not in use", () => {
    render(<BillingPlanCard current={false} plan={FALLBACK_PLAN_ENTRY} />);

    expect(screen.getByRole("button", { name: "Free plan" })).toBeDisabled();
  });

  it("states the renewal cadence on Studio Pro", () => {
    const pro = DEFAULT_PLAN_CATALOG.find((plan) => plan.planKey === "STUDIO_PRO");
    if (!pro) throw new Error("Studio Pro fixture missing");
    render(<BillingPlanCard current={false} plan={pro} />);
    expect(screen.getByText("Renews monthly")).toBeInTheDocument();
  });
});
