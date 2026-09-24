import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingHeader } from "../../../../apps/web/src/features/marketing/marketing-header";

describe("MarketingHeader", () => {
  it("provides product anchors and real authentication destinations", () => {
    render(<MarketingHeader user={null} />);

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
  it("shows a signed-in person their account instead of sign-in buttons", () => {
    render(
      <MarketingHeader
        user={{
          id: "user-1",
          displayName: "Shashi Kiran",
          primaryEmail: "shashi@example.com",
          primaryPhone: null,
        }}
      />,
    );

    // The way back into the workspace lives in the account menu, beside
    // Profile & security and Log out, rather than as a separate button.
    const menu = screen.getByLabelText("Account menu for Shashi Kiran");
    const panel = menu.closest("details");
    expect(panel).not.toBeNull();
    expect(screen.getByRole("link", { name: "Dashboard", hidden: true })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(
      panel?.contains(screen.getByRole("link", { name: "Dashboard", hidden: true })),
    ).toBe(true);
    expect(
      screen.getByRole("link", { name: "Profile & security", hidden: true }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Log in" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Start free" }),
    ).not.toBeInTheDocument();
  });
});
