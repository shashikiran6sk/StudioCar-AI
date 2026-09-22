import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const usePathname = vi.fn();
vi.mock("next/navigation", () => ({ usePathname }));

const { AdminNavigation } = await import(
  "../../../../apps/web/src/features/admin/admin-navigation"
);

describe("AdminNavigation", () => {
  it("links to every administration destination", () => {
    usePathname.mockReturnValue("/admin");

    render(<AdminNavigation />);

    expect(
      screen.getByRole("link", { name: "Plans and pricing" }),
    ).toHaveAttribute("href", "/admin/pricing");
    expect(screen.getByRole("link", { name: "Administrators" })).toHaveAttribute(
      "href",
      "/admin/admins",
    );
  });

  it("marks the page being viewed for a screen reader", () => {
    usePathname.mockReturnValue("/admin/pricing");

    render(<AdminNavigation />);

    expect(screen.getByRole("link", { name: "Plans and pricing" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Overview" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
