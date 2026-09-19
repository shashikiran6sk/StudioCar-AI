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
});
