import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingHero } from "../../../../apps/web/src/features/marketing/marketing-hero";

describe("MarketingHero", () => {
  it("shows a usable comparison and product entry actions", () => {
    render(<MarketingHero batchLimits={{ free: 5, paid: 20 }} />);

    expect(screen.getByRole("heading", { name: /Turn every vehicle photo/ })).toBeVisible();
    expect(
      screen.getByRole("slider", { name: "Compare original and studio processed vehicle" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: /Process your car/ }))
      .toHaveAttribute("href", "/login?returnTo=%2Fdashboard");
    expect(screen.getByText("Originals")).toBeVisible();
    expect(screen.getByText("20×")).toBeVisible();
  });

  it("drops the paid batch proof when no paid plan is on offer", () => {
    render(<MarketingHero batchLimits={{ free: 5, paid: null }} />);

    expect(screen.queryByText("images per paid batch")).not.toBeInTheDocument();
    expect(screen.getByText("Async")).toBeVisible();
  });
});
