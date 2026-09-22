import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const requireAdministrator = vi.fn();
const getAdminOverview = vi.fn();

vi.mock(
  "../../../../../apps/web/src/server/admin/require-administrator",
  () => ({ requireAdministrator }),
);
vi.mock("../../../../../apps/web/src/server/admin/get-admin-overview", () => ({
  getAdminOverview,
}));

const { default: AdminOverviewPage } = await import(
  "../../../../../apps/web/src/app/(app)/admin/page"
);

describe("AdminOverviewPage", () => {
  it("authorizes for itself, not only through the layout", async () => {
    requireAdministrator.mockResolvedValue({ userId: "user-1" });
    getAdminOverview.mockResolvedValue({
      administratorCount: 1,
      userCount: 12,
      activePlanCount: 4,
      activeSubscriptionCount: 0,
      manualSubscriptionCount: 0,
      enabledSocialLinkCount: 0,
    });

    render(await AdminOverviewPage());

    expect(requireAdministrator).toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Overview", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Administrators")).toBeInTheDocument();
  });

  it("does not read the overview when authorization refuses", async () => {
    requireAdministrator.mockRejectedValue(new Error("NOT_FOUND"));
    getAdminOverview.mockClear();

    await expect(AdminOverviewPage()).rejects.toThrow("NOT_FOUND");
    expect(getAdminOverview).not.toHaveBeenCalled();
  });
});
