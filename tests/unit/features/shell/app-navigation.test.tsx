import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

import { AppNavigation } from "../../../../apps/web/src/features/shell/app-navigation";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

describe("AppNavigation", () => {
  it("marks the current available route and does not link future routes", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");

    render(<AppNavigation />);

    expect(screen.getByRole("link", { name: /Dashboard/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.queryByRole("link", { name: /Inventory/ })).toBeNull();
    expect(screen.getByText("Inventory").closest("span")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});
