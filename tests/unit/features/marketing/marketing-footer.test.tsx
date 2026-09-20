import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingFooter } from "../../../../apps/web/src/features/marketing/marketing-footer";

describe("MarketingFooter", () => {
  it("links implemented destinations and marks future company pages unavailable", () => {
    render(<MarketingFooter />);

    expect(screen.getByRole("navigation", { name: "Workspace footer links" }))
      .toBeVisible();
    expect(screen.getByRole("link", { name: "Inventory" })).toHaveAttribute(
      "href",
      "/inventory",
    );
    expect(screen.getByText("Privacy")).toHaveAttribute("aria-disabled", "true");
  });
});
