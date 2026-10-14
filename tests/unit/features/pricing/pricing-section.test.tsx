import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PricingSection } from "../../../../apps/web/src/features/pricing/pricing-section";
import { DEFAULT_PLAN_CATALOG } from "../../../../apps/web/src/server/plans/default-plan-catalog";

describe("PricingSection", () => {
  it("shows the configured plans without faking checkout", () => {
    render(<PricingSection plans={DEFAULT_PLAN_CATALOG} />);

    expect(
      screen.getByRole("heading", { name: /Start free. Add capacity/ }),
    ).toBeVisible();
    expect(screen.getByText("₹1,999")).toBeVisible();
    expect(screen.getAllByText(/Credits never expire/).length).toBeGreaterThan(0);
    for (const action of screen.getAllByRole("link")) {
      expect(action).toHaveAttribute("href", "/login?returnTo=%2Fdashboard");
    }
  });

  it("renders an administrator's edited price rather than a shipped one", () => {
    const edited = DEFAULT_PLAN_CATALOG.map((plan) =>
      plan.planKey === "FREE"
        ? { ...plan, priceMinorUnits: 249_900 }
        : plan,
    );

    render(<PricingSection plans={edited} />);

    expect(screen.getByText("₹2,499")).toBeVisible();
    expect(screen.getByText("₹1,999")).toBeVisible();
  });
});
