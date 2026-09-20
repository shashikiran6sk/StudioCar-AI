import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

import { AppNavigation } from "../../../../apps/web/src/features/shell/app-navigation";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

describe("AppNavigation", () => {
  it("marks the current available route and links delivered product routes", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");

    render(<AppNavigation />);

    expect(screen.getByRole("link", { name: /Dashboard/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: /Inventory/ })).toHaveAttribute(
      "href",
      "/inventory",
    );
    expect(screen.getByRole("link", { name: /Packs & Billing/ })).toHaveAttribute(
      "href",
      "/settings/billing",
    );
    expect(screen.queryByRole("link", { name: /Portfolio/ })).toBeNull();
  });
});
