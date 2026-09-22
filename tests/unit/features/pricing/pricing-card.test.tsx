import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PricingCard } from "../../../../apps/web/src/features/pricing/pricing-card";
import { FALLBACK_PLAN_ENTRY } from "../../../../apps/web/src/server/plans/default-plan-catalog";

describe("PricingCard", () => {
  it("shows the price, cadence and features a plan is configured with", () => {
    render(<PricingCard plan={FALLBACK_PLAN_ENTRY} />);

    expect(screen.getByText("₹0")).toBeVisible();
    expect(screen.getByText("forever")).toBeVisible();
    expect(screen.getByText("✓ 15 images in total")).toBeVisible();
  });

  it("sends every action to sign-in, because no checkout exists yet", () => {
    render(
      <PricingCard
        plan={{
          ...FALLBACK_PLAN_ENTRY,
          billingInterval: "MONTHLY",
          displayName: "Studio Plus",
          priceMinorUnits: 799_900,
          purchasable: true,
        }}
      />,
    );

    const action = screen.getByRole("link", { name: "Choose Studio Plus" });
    expect(action).toHaveAttribute("href", "/login?returnTo=%2Fdashboard");
    expect(screen.getByText("₹7,999")).toBeVisible();
    expect(screen.getByText("/ month")).toBeVisible();
  });
});
