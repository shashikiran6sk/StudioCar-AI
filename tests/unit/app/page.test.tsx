import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const getPlanCatalog = vi.fn();
const getEnabledSocialLinks = vi.fn();
vi.mock("../../../apps/web/src/server/plans/get-plan-catalog", () => ({
  getPlanCatalog,
}));
vi.mock("../../../apps/web/src/server/content/get-social-links", () => ({
  getEnabledSocialLinks,
  getAllSocialLinks: vi.fn(),
}));

const { default: HomePage } = await import("../../../apps/web/src/app/page");
const { DEFAULT_PLAN_CATALOG } = await import(
  "../../../apps/web/src/server/plans/default-plan-catalog"
);

describe("HomePage", () => {
  it("assembles the complete screenshot-derived product page", async () => {
    getPlanCatalog.mockResolvedValue(DEFAULT_PLAN_CATALOG);
    getEnabledSocialLinks.mockResolvedValue([]);

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
    getEnabledSocialLinks.mockResolvedValue([]);
    getPlanCatalog.mockResolvedValue(
      DEFAULT_PLAN_CATALOG.map((plan) =>
        plan.planKey === "STUDIO_PRO"
          ? { ...plan, priceMinorUnits: 449_900 }
          : plan,
      ),
    );

    render(await HomePage());

    expect(screen.getByText("₹4,499")).toBeVisible();
  });
  it("shows the footer links an administrator configured", async () => {
    getPlanCatalog.mockResolvedValue(DEFAULT_PLAN_CATALOG);
    getEnabledSocialLinks.mockResolvedValue([
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
});
