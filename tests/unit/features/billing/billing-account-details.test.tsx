import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BillingAccountDetails } from "../../../../apps/web/src/features/billing/billing-account-details";
describe("BillingAccountDetails", () => {
  it("shows cumulative purchased credits and immutable receipt links without renewal actions", () => {
    render(<BillingAccountDetails status={{ purchasedCredits: 175, purchasedCreditsGranted: 200, checkoutPaymentStatus: null }}
      payments={[{ id: "payment-1", createdAt: new Date("2026-09-25"), productCode: "STUDIO_PLUS", amountPaise: 199900, currency: "INR", status: "PAID", receipt: { id: "receipt-1" } }]} />);
    expect(screen.getByText("175 remaining")).toBeInTheDocument();
    expect(screen.getByText(/Credits never expire/)).toBeInTheDocument();
    expect(screen.queryByText(/Studio Pro|Monthly|renewal|Cancellation/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View" })).toHaveAttribute("href", "/billing/receipts/receipt-1");
  });
  it("retains pending and failed order references so delayed confirmation is recoverable", () => {
    render(<BillingAccountDetails status={{ purchasedCredits: 0, purchasedCreditsGranted: 0, checkoutPaymentStatus: null }}
      payments={[{ id: "pending", createdAt: new Date("2026-10-08"), productCode: "STUDIO_PLUS", amountPaise: 199900, currency: "INR", status: "VERIFIED", razorpayOrderId: "order_pending", receipt: null },
        { id: "failed", createdAt: new Date("2026-10-08"), productCode: "STUDIO_PLUS", amountPaise: 199900, currency: "INR", status: "FAILED", receipt: null }]} />);
    expect(screen.getByText("Awaiting capture")).toBeVisible(); expect(screen.getByText("Failed")).toBeVisible();
    expect(screen.getByText("Order: order_pending")).toBeVisible(); expect(screen.queryByRole("link", { name: "View" })).not.toBeInTheDocument();
  });

});
