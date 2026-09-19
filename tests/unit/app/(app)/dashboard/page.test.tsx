import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import DashboardPage from "../../../../../apps/web/src/app/(app)/dashboard/page";
import { getCurrentSession } from "../../../../../apps/web/src/server/auth/get-current-session";

vi.mock("../../../../../apps/web/src/server/auth/get-current-session", () => ({
  getCurrentSession: vi.fn(),
}));

describe("DashboardPage", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("greets the authenticated user without fabricating operational data", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 19, 9));
    vi.mocked(getCurrentSession).mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      expiresAt: new Date(2026, 9, 19),
      user: {
        id: "user-1",
        displayName: "Priya Sharma",
        primaryEmail: "priya@example.com",
        primaryPhone: null,
      },
    });
    const page = await DashboardPage();

    render(page);

    expect(screen.getByRole("heading", { name: "Good morning, Priya." }))
      .toBeInTheDocument();
    expect(screen.getByText("Saturday, 19 September")).toBeInTheDocument();
    expect(screen.getByText("Your workspace is ready")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "+ Upload Vehicle" }),
    ).toBeInTheDocument();
  });
});
