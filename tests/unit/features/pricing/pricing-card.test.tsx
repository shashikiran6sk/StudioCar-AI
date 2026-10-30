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
    expect(screen.getByRole("link", { name: "Start free" })).toHaveAttribute(
      "href",
      "/login?returnTo=%2Fdashboard",
    );
  });

  it("sends a paid plan through sign-in to the Billing packs", () => {
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
    expect(action).toHaveAttribute(
      "href",
      "/login?returnTo=%2Fsettings%2Fbilling%23packs",
    );
    expect(screen.getByText("₹7,999")).toBeVisible();
    expect(screen.getByText("/ month")).toBeVisible();
  });
});
