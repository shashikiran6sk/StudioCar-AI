import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingFinalCta } from "../../../../apps/web/src/features/marketing/marketing-final-cta";

describe("MarketingFinalCta", () => {
  it("routes prospects to sign in and existing users to inventory", () => {
    render(<MarketingFinalCta />);

    expect(screen.getByRole("link", { name: "Process your first vehicle" }))
      .toHaveAttribute("href", "/login?returnTo=%2Fdashboard");
    expect(screen.getByRole("link", { name: "View Inventory" }))
      .toHaveAttribute("href", "/inventory");
  });
});
