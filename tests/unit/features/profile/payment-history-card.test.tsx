import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PaymentHistoryCard } from "../../../../apps/web/src/features/profile/payment-history-card";
import type { PaymentHistoryEntry } from "../../../../packages/contracts/src/billing";

const payment = {
  id: "0f600bc6-7c7f-44c8-91ed-4b5b90c9c789", createdAt: "2026-10-08T00:00:00.000Z", paidAt: "2026-10-08T01:00:00.000Z",
  productCode: "STUDIO_PLUS", amountPaise: 199900, currency: "INR", status: "PAID",
  razorpayOrderId: "order_example", razorpayPaymentId: "pay_example",
} satisfies PaymentHistoryEntry;

describe("PaymentHistoryCard", () => {
  it("shows captured purchase amounts and recovery references without receipts", () => {
    render(<PaymentHistoryCard payments={[payment]} />);
    expect(screen.getByRole("heading", { name: "Payment history" })).toBeVisible();
    expect(screen.getByText("₹1,999")).toBeVisible();
    expect(screen.getByText("Paid")).toBeVisible();
    expect(screen.getByText("Order: order_example")).toBeVisible();
    expect(screen.getByText("Payment: pay_example")).toBeVisible();
    expect(screen.queryByRole("columnheader", { name: "Receipt" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View" })).not.toBeInTheDocument();
  });

  it("keeps failed and pending purchases visible even without provider references", () => {
    render(<PaymentHistoryCard payments={[{ ...payment, status: "FAILED", paidAt: null, razorpayOrderId: null, razorpayPaymentId: null }]} />);
    expect(screen.getByText("Failed")).toBeVisible();
    expect(screen.getByText(`Purchase: ${payment.id}`)).toBeVisible();
  });

  it("explains an empty history without fabricating purchases", () => {
    render(<PaymentHistoryCard payments={[]} />);
    expect(screen.getByText(/No payments yet/)).toBeVisible();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
