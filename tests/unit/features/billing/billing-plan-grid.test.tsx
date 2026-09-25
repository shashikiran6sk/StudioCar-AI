import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BillingPlanGrid } from "../../../../apps/web/src/features/billing/billing-plan-grid";
import { DEFAULT_PLAN_CATALOG } from "../../../../apps/web/src/server/plans/default-plan-catalog";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

describe("BillingPlanGrid", () => {
  it("shows every configured plan and marks the one in use", () => {
    render(
      <BillingPlanGrid currentPlanKey="FREE" plans={DEFAULT_PLAN_CATALOG} />,
    );

    expect(screen.getByText("₹1,999")).toBeInTheDocument();
    expect(screen.getByText("₹5,499")).toBeInTheDocument();
    expect(screen.getByText("Studio Plus")).toBeInTheDocument();
    expect(screen.queryByText("Studio Pack")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Current plan" })).toBeDisabled();
  });

  it("offers nothing when no plan is configured", () => {
    render(<BillingPlanGrid currentPlanKey="FREE" plans={[]} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
