import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const requireAdministrator = vi.fn();
const getFullPlanCatalog = vi.fn();

vi.mock(
  "../../../../../../apps/web/src/server/admin/require-administrator",
  () => ({ requireAdministrator }),
);
vi.mock("../../../../../../apps/web/src/server/plans/get-plan-catalog", () => ({
  getFullPlanCatalog,
}));
vi.mock(
  "../../../../../../apps/web/src/server/admin/plan-configuration-actions",
  () => ({ savePlanConfigurationAction: vi.fn() }),
);

const { default: AdminPricingPage } = await import(
  "../../../../../../apps/web/src/app/(app)/admin/pricing/page"
);
const { DEFAULT_PLAN_CATALOG } = await import(
  "../../../../../../apps/web/src/server/plans/default-plan-catalog"
);

describe("AdminPricingPage", () => {
  it("authorizes for itself before reading any configuration", async () => {
    requireAdministrator.mockRejectedValue(new Error("NOT_FOUND"));
    getFullPlanCatalog.mockClear();

    await expect(AdminPricingPage()).rejects.toThrow("NOT_FOUND");
    expect(getFullPlanCatalog).not.toHaveBeenCalled();
  });

  it("offers an editor for every plan, including deactivated ones", async () => {
    requireAdministrator.mockResolvedValue({ userId: "admin-1" });
    getFullPlanCatalog.mockResolvedValue(
      DEFAULT_PLAN_CATALOG.map((plan) =>
        plan.planKey === "STUDIO_PLUS" ? { ...plan, active: false } : plan,
      ),
    );

    render(await AdminPricingPage());

    expect(
      screen.getByRole("heading", { name: "Plans and pricing" }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Studio Plus" })).toBeVisible();
    expect(screen.getAllByRole("button", { name: "Save plan" })).toHaveLength(
      DEFAULT_PLAN_CATALOG.length,
    );
  });
});
