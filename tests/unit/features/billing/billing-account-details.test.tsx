import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BillingAccountDetails } from "../../../../apps/web/src/features/billing/billing-account-details";

describe("BillingAccountDetails", () => {
  it("shows Pro allowance and purchased credits separately with one receipt per payment", () => {
    render(<BillingAccountDetails
      status={{
        subscription: { plan: "STUDIO_PRO_MONTHLY", status: "ACTIVE", pricePaise: 549900,
          currentPeriodStart: "2026-09-25T00:00:00.000Z", currentPeriodEnd: "2026-10-25T00:00:00.000Z",
          allowance: 400, consumed: 153, remaining: 247, cancelAtPeriodEnd: true },
        purchasedCredits: 100, purchasedCreditsGranted: 100,
      }}
      payments={[{ id: "payment-1", createdAt: new Date("2026-09-25"), productCode: "STUDIO_PRO_MONTHLY",
        amountPaise: 549900, currency: "INR", status: "PAID", receipt: { id: "receipt-1" } }]}
    />);
    expect(screen.getByText("Monthly allowance: 247 / 400 remaining")).toBeInTheDocument();
    expect(screen.getByText("100 remaining")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View" })).toHaveAttribute("href", "/billing/receipts/receipt-1");
  });
});
