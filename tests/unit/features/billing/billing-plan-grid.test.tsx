import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BillingPlanGrid } from "../../../../apps/web/src/features/billing/billing-plan-grid";

describe("BillingPlanGrid", () => {
  it("reuses all canonical homepage plan names and prices", () => {
    render(<BillingPlanGrid currentPlanKey="FREE" />);
    expect(screen.getByText("₹1,499")).toBeInTheDocument();
    expect(screen.getByText("₹3,999")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Current plan" })).toBeDisabled();
  });
});
