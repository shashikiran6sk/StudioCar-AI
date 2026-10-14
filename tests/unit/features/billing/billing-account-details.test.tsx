import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BillingAccountDetails } from "../../../../apps/web/src/features/billing/billing-account-details";

describe("BillingAccountDetails", () => {
  it("shows cumulative purchased credits and directs history to Profile", () => {
    render(<BillingAccountDetails status={{ purchasedCredits: 175, purchasedCreditsGranted: 200, checkoutPaymentStatus: null }} />);
    expect(screen.getByText("175 remaining")).toBeInTheDocument();
    expect(screen.getByText(/Credits never expire/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View payment history in Profile" })).toHaveAttribute("href", "/settings/profile#payment-history");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText(/Receipt|renewal|Cancellation/)).not.toBeInTheDocument();
  });
});
