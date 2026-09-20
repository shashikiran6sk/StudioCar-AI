import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BillingUnavailableAction } from "../../../../apps/web/src/features/billing/billing-unavailable-action";

describe("BillingUnavailableAction", () => {
  it("explicitly confirms that checkout made no payment", () => {
    render(<BillingUnavailableAction label="Upgrade plan" planName="Studio Pro" />);
    fireEvent.click(screen.getByRole("button", { name: "Upgrade plan" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("No payment has been made");
  });
});
