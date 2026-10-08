import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getPublicPlanCatalog = vi.fn();
const getPublicEnabledSocialLinks = vi.fn();
vi.mock("../../../apps/web/src/server/plans/get-plan-catalog", () => ({
  getPublicPlanCatalog,
}));
const getCurrentSession = vi.fn();
vi.mock("../../../apps/web/src/server/auth/get-current-session", () => ({
  getCurrentSession,
}));
vi.mock("../../../apps/web/src/server/content/get-social-links", () => ({
  getPublicEnabledSocialLinks,
  getAllSocialLinks: vi.fn(),
}));

const { default: HomePage } = await import("../../../apps/web/src/app/page");
const { DEFAULT_PLAN_CATALOG } = await import(
  "../../../apps/web/src/server/plans/default-plan-catalog"
);

describe("HomePage", () => {
  beforeEach(() => {
    getCurrentSession.mockResolvedValue(null);
  });

  it("assembles the complete screenshot-derived product page", async () => {
    getPublicPlanCatalog.mockResolvedValue(DEFAULT_PLAN_CATALOG);
    getPublicEnabledSocialLinks.mockResolvedValue([]);

    render(await HomePage());

    expect(
      screen.getByRole("heading", {
        name: "Turn every vehicle photo into showroom material.",
      }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: /complete portfolio in four steps/ }))
      .toBeVisible();
    expect(screen.getByRole("heading", { name: /Start free. Add capacity/ }))
      .toBeVisible();
    expect(screen.getByText("© 2026 StudioCar AI. All rights reserved.")).toBeVisible();
  });

  it("quotes the prices an administrator configured", async () => {
    getPublicEnabledSocialLinks.mockResolvedValue([]);
    getPublicPlanCatalog.mockResolvedValue(
      DEFAULT_PLAN_CATALOG.map((plan) =>
        plan.planKey === "FREE"
          ? { ...plan, priceMinorUnits: 449_900 }
          : plan,
      ),
    );

    render(await HomePage());

    expect(screen.getByText("₹4,499")).toBeVisible();
  });
  it("shows the footer links an administrator configured", async () => {
    getPublicPlanCatalog.mockResolvedValue(DEFAULT_PLAN_CATALOG);
    getPublicEnabledSocialLinks.mockResolvedValue([
      {
        enabled: true,
        label: "Instagram",
        platform: "INSTAGRAM",
        url: "https://instagram.com/studiocar",
      },
    ]);

    render(await HomePage());

    expect(
      screen.getByRole("navigation", { name: "Social links" }),
    ).toBeVisible();
  });
  it("greets a signed-in visitor with their account, not a sign-in prompt", async () => {
    getPublicPlanCatalog.mockResolvedValue(DEFAULT_PLAN_CATALOG);
    getPublicEnabledSocialLinks.mockResolvedValue([]);
    getCurrentSession.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      expiresAt: new Date("2027-01-01T00:00:00.000Z"),
      user: {
        id: "user-1",
        displayName: "Shashi Kiran",
        primaryEmail: "shashi@example.com",
        primaryPhone: null,
      },
    });

    render(await HomePage());

    expect(
      screen.getByLabelText("Account menu for Shashi Kiran"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Log in" })).not.toBeInTheDocument();
  });
});
