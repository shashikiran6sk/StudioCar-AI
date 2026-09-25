import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarketingFooter } from "../../../../apps/web/src/features/marketing/marketing-footer";

const instagram = {
  enabled: true,
  label: "Instagram",
  platform: "INSTAGRAM" as const,
  url: "https://instagram.com/studiocar",
};

describe("MarketingFooter", () => {
  it("links implemented destinations and marks future company pages unavailable", () => {
    render(<MarketingFooter socialLinks={[]} />);

    expect(screen.getByRole("navigation", { name: "Workspace footer links" }))
      .toBeVisible();
    expect(screen.getByRole("link", { name: "Inventory" })).toHaveAttribute(
      "href",
      "/inventory",
    );
    expect(screen.getByText("Privacy")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/#about");
    expect(screen.getByRole("heading", { name: "About StudioCar AI" })).toBeInTheDocument();
  });

  it("shows nothing at all when no social link is configured", () => {
    render(<MarketingFooter socialLinks={[]} />);

    // An empty heading with no links under it would be worse than no section.
    expect(
      screen.queryByRole("navigation", { name: "Social links" }),
    ).not.toBeInTheDocument();
  });

  it("sends people to the address an administrator configured", () => {
    render(<MarketingFooter socialLinks={[instagram]} />);

    const link = screen.getByRole("link", { name: "Instagram" });
    expect(link).toHaveAttribute("href", "https://instagram.com/studiocar");
    expect(link).toHaveAttribute("rel", "me noopener noreferrer");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("renders links in the order it is given them", () => {
    render(
      <MarketingFooter
        socialLinks={[
          instagram,
          {
            enabled: true,
            label: "LinkedIn",
            platform: "LINKEDIN" as const,
            url: "https://linkedin.com/company/studiocar",
          },
        ]}
      />,
    );

    const social = screen.getByRole("navigation", { name: "Social links" });
    expect(
      [...social.querySelectorAll("a")].map((anchor) => anchor.textContent),
    ).toEqual(["Instagram", "LinkedIn"]);
  });
});
