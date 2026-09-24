import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import { afterEach, describe, expect, it, vi } from "vitest";

import LoginPage from "../../../../../apps/web/src/app/(auth)/login/page";
import { getCurrentSession } from "../../../../../apps/web/src/server/auth/get-current-session";
import { getVerifiedPhoneForBrowser } from "../../../../../apps/web/src/server/auth/phone/get-verified-phone-for-browser";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("../../../../../apps/web/src/server/auth/get-current-session", () => ({
  getCurrentSession: vi.fn(),
}));
vi.mock("../../../../../apps/web/src/server/auth/phone/get-verified-phone-for-browser", () => ({
  getVerifiedPhoneForBrowser: vi.fn(),
}));

describe("LoginPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("offers Google and phone authentication with the safe return path", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue(null);
    vi.mocked(getVerifiedPhoneForBrowser).mockResolvedValue(null);
    const page = await LoginPage({
      searchParams: Promise.resolve({ returnTo: "/inventory?status=ready" }),
    });

    render(page);

    expect(
      screen.getByRole("heading", { name: "Sign in to StudioCar AI" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Continue with Google/ })).toHaveAttribute(
      "href",
      "/api/auth/google/start?returnTo=%2Finventory%3Fstatus%3Dready",
    );
    expect(
      screen.getByRole("button", { name: "Continue with phone" }),
    ).toBeInTheDocument();
  });

  it("restores account choices after a cancelled Google onboarding", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue(null);
    vi.mocked(getVerifiedPhoneForBrowser).mockResolvedValue("+919876543210");
    const page = await LoginPage({
      searchParams: Promise.resolve({ phoneSetup: "cancelled" }),
    });
    render(page);
    expect(screen.getByRole("link", { name: "Link with Google" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Create new account" })).toBeVisible();
    expect(screen.queryByRole("link", { name: "Continue with Google" })).toBeNull();
  });

  it("redirects an authenticated user to the dashboard", async () => {
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

    await expect(
      LoginPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});
