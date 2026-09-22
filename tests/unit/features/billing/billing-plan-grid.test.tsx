import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BillingPlanGrid } from "../../../../apps/web/src/features/billing/billing-plan-grid";
import { DEFAULT_PLAN_CATALOG } from "../../../../apps/web/src/server/plans/default-plan-catalog";

describe("BillingPlanGrid", () => {
  it("shows every configured plan and marks the one in use", () => {
    render(
      <BillingPlanGrid currentPlanKey="FREE" plans={DEFAULT_PLAN_CATALOG} />,
    );

    expect(screen.getByText("₹1,499")).toBeInTheDocument();
    expect(screen.getByText("₹3,999")).toBeInTheDocument();
    expect(screen.getByText("₹7,999")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Current plan" })).toBeDisabled();
  });

  it("offers nothing when no plan is configured", () => {
    render(<BillingPlanGrid currentPlanKey="FREE" plans={[]} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
