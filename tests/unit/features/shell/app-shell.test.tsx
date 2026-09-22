import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

import { AppShell } from "../../../../apps/web/src/features/shell/app-shell";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

describe("AppShell", () => {
  it("provides the workspace navigation, account control, and content landmark", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");

    render(
      <AppShell
        planUsage={null}
        user={{
          id: "user-1",
          displayName: "Priya Sharma",
          primaryEmail: "priya@example.com",
          primaryPhone: null,
        }}
      >
        <h1>Dashboard content</h1>
      </AppShell>,
    );

    expect(screen.getByRole("navigation", { name: "Workspace" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("Dashboard content");
    expect(screen.getByLabelText("Account menu for Priya Sharma")).toBeInTheDocument();
  });

  it("shows the plan and usage summary in the sidebar", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");

    render(
      <AppShell
        planUsage={{
          planKey: "FREE",
          planName: "Free",
          imagesUsed: 8,
          imageCapacity: 15,
          storageUsedBytes: 1_288_490_188,
          storageCapacityBytes: 3_221_225_472,
        }}
        user={{
          id: "user-1",
          displayName: "Priya Sharma",
          primaryEmail: "priya@example.com",
          primaryPhone: null,
        }}
      >
        <h1>Dashboard content</h1>
      </AppShell>,
    );

    expect(screen.getByText("Free plan")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "8 / 15 images used" }),
    ).toHaveAttribute("aria-valuenow", "8");
  });
});
