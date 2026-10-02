import { fireEvent, render, screen, within } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

import { MobileNavigation } from "../../../../apps/web/src/features/shell/mobile-navigation";
import type { PlanUsageSummary } from "../../../../apps/web/src/server/plan-usage/plan-usage.types";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

const PLAN_USAGE: PlanUsageSummary = {
  planKey: "FREE",
  planName: "Free",
  imagesUsed: 8,
  imageCapacity: 15,
  maxImagesPerBatch: 5,
  storageUsedBytes: 1_288_490_188,
  storageCapacityBytes: 3_221_225_472,
};

function openDrawer() {
  fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
  return screen.getByRole("dialog", { name: "Workspace navigation" });
}

describe("MobileNavigation", () => {
  it("names the current section beside a closed menu control", () => {
    vi.mocked(usePathname).mockReturnValue("/inventory/vehicle-1");

    render(<MobileNavigation planUsage={null} showAdmin={false} />);

    expect(screen.getByText("Inventory")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("offers the same destinations, plan summary, and log out as the sidebar", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    render(<MobileNavigation planUsage={PLAN_USAGE} showAdmin={false} />);

    const drawer = openDrawer();
    const navigation = within(drawer).getByRole("navigation", { name: "Workspace" });

    expect(within(navigation).getAllByRole("link")).toHaveLength(4);
    expect(
      within(navigation).getByRole("link", { name: /Dashboard/ }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(drawer).getByRole("link", { name: "StudioCar AI home" }),
    ).toHaveAttribute("href", "/");
    expect(
      within(drawer).getByRole("progressbar", { name: "8 / 15 images used" }),
    ).toBeInTheDocument();
    expect(
      within(drawer).getByRole("button", { name: "Log out" }).closest("form"),
    ).toHaveAttribute("action", "/api/auth/logout");
  });

  it("includes administration only for an administrator", () => {
    vi.mocked(usePathname).mockReturnValue("/admin");
    render(<MobileNavigation planUsage={null} showAdmin />);

    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(within(openDrawer()).getByRole("link", { name: /Admin/ })).toHaveAttribute(
      "href",
      "/admin",
    );
  });

  it("closes when a destination is chosen", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    render(<MobileNavigation planUsage={null} showAdmin={false} />);

    fireEvent.click(within(openDrawer()).getByRole("link", { name: /Inventory/ }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes from its close control and on Escape", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    render(<MobileNavigation planUsage={null} showAdmin={false} />);

    fireEvent.click(
      within(openDrawer()).getByRole("button", { name: "Close navigation" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    openDrawer();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
