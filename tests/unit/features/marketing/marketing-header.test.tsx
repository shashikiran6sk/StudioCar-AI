import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingHeader } from "../../../../apps/web/src/features/marketing/marketing-header";

describe("MarketingHeader", () => {
  it("provides product anchors and real authentication destinations", () => {
    render(<MarketingHeader />);

    expect(screen.getByRole("navigation", { name: "Product" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Features" })).toHaveAttribute(
      "href",
      "#features",
    );
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Start free" })).toHaveAttribute(
      "href",
      "/login?returnTo=%2Fdashboard",
    );
  });
});
