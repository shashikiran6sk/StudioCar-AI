import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BrandHomeLink } from "../../../../apps/web/src/features/shell/brand-home-link";

describe("BrandHomeLink", () => {
  it("takes you to the homepage", () => {
    render(<BrandHomeLink />);

    expect(
      screen.getByRole("link", { name: "StudioCar AI home" }),
    ).toHaveAttribute("href", "/");
  });

  it("keeps the logo's own placement class", () => {
    const { container } = render(<BrandHomeLink className="app-sidebar__brand" />);

    expect(container.querySelector(".app-sidebar__brand")).toBeInTheDocument();
  });
});
