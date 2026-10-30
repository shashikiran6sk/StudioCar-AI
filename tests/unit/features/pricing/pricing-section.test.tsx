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
    expect(screen.getByText("₹1,499")).toBeVisible();
    expect(screen.getByText(/billing provider is connected/)).toBeVisible();
    expect(screen.getByRole("link", { name: "Start free" })).toHaveAttribute(
      "href",
      "/login?returnTo=%2Fdashboard",
    );
    for (const name of ["Choose Studio Plus", "Choose Studio Pro"]) {
      expect(screen.getByRole("link", { name })).toHaveAttribute(
        "href",
        "/login?returnTo=%2Fsettings%2Fbilling%23packs",
      );
    }
  });

  it("renders an administrator's edited price rather than a shipped one", () => {
    const edited = DEFAULT_PLAN_CATALOG.map((plan) =>
      plan.planKey === "STUDIO_PLUS"
        ? { ...plan, priceMinorUnits: 249_900 }
        : plan,
    );

    render(<PricingSection plans={edited} />);

    expect(screen.getByText("₹2,499")).toBeVisible();
    expect(screen.queryByText("₹1,499")).not.toBeInTheDocument();
  });
});
