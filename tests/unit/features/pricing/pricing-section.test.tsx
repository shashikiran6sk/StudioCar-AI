import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PricingSection } from "../../../../apps/web/src/features/pricing/pricing-section";

describe("PricingSection", () => {
  it("shows canonical prototype plans without faking checkout", () => {
    render(<PricingSection />);

    expect(screen.getByRole("heading", { name: /Start free. Add capacity/ })).toBeVisible();
    expect(screen.getByText("₹1,499")).toBeVisible();
    expect(screen.getByText(/billing provider is connected/)).toBeVisible();
    for (const action of screen.getAllByRole("link")) {
      expect(action).toHaveAttribute("href", "/login?returnTo=%2Fdashboard");
    }
  });
});
