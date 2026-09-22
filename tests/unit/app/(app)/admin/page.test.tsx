import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const requireAdministrator = vi.fn();
const getAdminOverview = vi.fn();
const getAdminPlanDistribution = vi.fn();
const getAdminActivity = vi.fn();
const getPlanCatalog = vi.fn();

vi.mock(
  "../../../../../apps/web/src/server/admin/require-administrator",
  () => ({ requireAdministrator }),
);
vi.mock("../../../../../apps/web/src/server/admin/get-admin-overview", () => ({
  getAdminOverview,
  getAdminPlanDistribution,
}));
vi.mock("../../../../../apps/web/src/server/admin/get-admin-activity", () => ({
  getAdminActivity,
}));
vi.mock("../../../../../apps/web/src/server/plans/get-plan-catalog", () => ({
  getPlanCatalog,
  getFullPlanCatalog: vi.fn(),
}));

const { default: AdminOverviewPage } = await import(
  "../../../../../apps/web/src/app/(app)/admin/page"
);
const { DEFAULT_PLAN_CATALOG } = await import(
  "../../../../../apps/web/src/server/plans/default-plan-catalog"
);

function ready() {
  requireAdministrator.mockResolvedValue({ userId: "user-1" });
  getAdminOverview.mockResolvedValue({
    administratorCount: 1,
    userCount: 12,
    activePlanCount: 4,
    activeSubscriptionCount: 0,
    manualSubscriptionCount: 0,
    enabledSocialLinkCount: 0,
  });
  getAdminPlanDistribution.mockResolvedValue([]);
  getAdminActivity.mockResolvedValue([]);
  getPlanCatalog.mockResolvedValue(DEFAULT_PLAN_CATALOG);
}

describe("AdminOverviewPage", () => {
  it("authorizes for itself, not only through the layout", async () => {
    vi.clearAllMocks();
    ready();

    render(await AdminOverviewPage());

    expect(requireAdministrator).toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Overview", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Administrators")).toBeInTheDocument();
  });

  it("reads nothing when authorization refuses", async () => {
    vi.clearAllMocks();
    requireAdministrator.mockRejectedValue(new Error("NOT_FOUND"));

    await expect(AdminOverviewPage()).rejects.toThrow("NOT_FOUND");
    expect(getAdminOverview).not.toHaveBeenCalled();
    expect(getAdminActivity).not.toHaveBeenCalled();
    expect(getAdminPlanDistribution).not.toHaveBeenCalled();
  });

  it("names each plan rather than showing the key it is stored under", async () => {
    vi.clearAllMocks();
    ready();
    getAdminPlanDistribution.mockResolvedValue([
      { accountCount: 3, planKey: "STUDIO_PLUS" },
    ]);

    render(await AdminOverviewPage());

    expect(screen.getByText("Studio Plus")).toBeInTheDocument();
    expect(screen.queryByText("STUDIO_PLUS")).not.toBeInTheDocument();
  });

  it("falls back to the stored key when the catalog no longer describes it", async () => {
    vi.clearAllMocks();
    ready();
    getAdminPlanDistribution.mockResolvedValue([
      { accountCount: 1, planKey: "LEGACY_PLAN" },
    ]);

    render(await AdminOverviewPage());

    // Showing the key is better than showing a blank row.
    expect(screen.getByText("LEGACY_PLAN")).toBeInTheDocument();
  });

  it("shows what has recently been changed", async () => {
    vi.clearAllMocks();
    ready();
    getAdminActivity.mockResolvedValue([
      {
        actorLabel: "Ops Lead",
        id: "0e879f46-1193-4d77-b785-057fe026d998",
        occurredAt: "2026-09-22T10:00:00.000Z",
        summary: "Updated a plan (STUDIO_PRO).",
      },
    ]);

    render(await AdminOverviewPage());

    expect(
      screen.getByText("Updated a plan (STUDIO_PRO)."),
    ).toBeInTheDocument();
  });
});
