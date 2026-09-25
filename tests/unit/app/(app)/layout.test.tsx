import { render, screen } from "@testing-library/react";
import { redirect, usePathname } from "next/navigation";
import { afterEach, describe, expect, it, vi } from "vitest";

import AuthenticatedLayout, { metadata } from "../../../../apps/web/src/app/(app)/layout";
import { getCurrentSession } from "../../../../apps/web/src/server/auth/get-current-session";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
  usePathname: vi.fn(),
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("../../../../apps/web/src/server/auth/get-current-session", () => ({
  getCurrentSession: vi.fn(),
}));

vi.mock("../../../../apps/web/src/server/plan-usage/get-plan-usage-summary", () => ({
  getPlanUsageSummary: vi.fn(async () => null),
}));

vi.mock(
  "../../../../apps/web/src/server/admin/is-current-user-administrator",
  () => ({ isCurrentUserAdministrator: vi.fn(async () => false) }),
);

vi.mock("../../../../apps/web/src/server/plans/get-plan-catalog", () => ({
  getPlanCatalog: vi.fn(async () => []),
}));

describe("AuthenticatedLayout", () => {
  it("keeps all workspace pages out of search indexes", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects requests without an active session", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue(null);

    await expect(
      AuthenticatedLayout({ children: <p>Private</p> }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("renders the application shell for an active session", async () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    vi.mocked(getCurrentSession).mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      expiresAt: new Date("2026-10-19T00:00:00.000Z"),
      user: {
        id: "user-1",
        displayName: "Priya Sharma",
        primaryEmail: "priya@example.com",
        primaryPhone: null,
      },
    });
    const layout = await AuthenticatedLayout({ children: <p>Private</p> });

    render(layout);

    expect(screen.getByRole("main")).toHaveTextContent("Private");
    expect(screen.getByLabelText("Account menu for Priya Sharma")).toBeInTheDocument();
  });
});
