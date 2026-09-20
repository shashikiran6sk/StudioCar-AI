import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingHero } from "../../../../apps/web/src/features/marketing/marketing-hero";

describe("MarketingHero", () => {
  it("shows a usable comparison and product entry actions", () => {
    render(<MarketingHero />);

    expect(screen.getByRole("heading", { name: /Turn every vehicle photo/ })).toBeVisible();
    expect(
      screen.getByRole("slider", { name: "Compare original and studio processed vehicle" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: /Process your first vehicle/ }))
      .toHaveAttribute("href", "/login?returnTo=%2Fdashboard");
    expect(screen.getByText("Originals")).toBeVisible();
  });
});
