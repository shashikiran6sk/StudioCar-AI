import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

import { AppNavigation } from "../../../../apps/web/src/features/shell/app-navigation";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

describe("AppNavigation", () => {
  it("links every workspace destination", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");

    render(<AppNavigation />);

    expect(screen.getByRole("link", { name: /Dashboard/ })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByRole("link", { name: /Inventory/ })).toHaveAttribute(
      "href",
      "/inventory",
    );
    expect(screen.getByRole("link", { name: /Packs & Billing/ })).toHaveAttribute(
      "href",
      "/settings/billing",
    );
    expect(screen.getByRole("link", { name: /Profile/ })).toHaveAttribute(
      "href",
      "/settings/profile",
    );
    expect(screen.getAllByRole("link")).toHaveLength(4);
  });

  it("no longer offers the retired destinations", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");

    render(<AppNavigation />);

    expect(screen.queryByRole("link", { name: /Portfolio/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /^Usage/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /Help/ })).toBeNull();
  });

  it("marks the current destination for assistive technology", () => {
    vi.mocked(usePathname).mockReturnValue("/settings/billing");

    render(<AppNavigation />);

    expect(
      screen.getByRole("link", { name: /Packs & Billing/ }),
    ).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Dashboard/ })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("keeps inventory current while a vehicle portfolio is open", () => {
    vi.mocked(usePathname).mockReturnValue("/inventory/vehicle-1");

    render(<AppNavigation />);

    expect(screen.getByRole("link", { name: /Inventory/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
