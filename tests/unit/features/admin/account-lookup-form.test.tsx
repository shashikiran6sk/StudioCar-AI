import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AccountLookupForm } from "../../../../apps/web/src/features/admin/account-lookup-form";

describe("AccountLookupForm", () => {
  it("submits to the subscriptions page so a lookup is an address", () => {
    const { container } = render(<AccountLookupForm value="" />);

    expect(container.querySelector("form")).toHaveAttribute(
      "action",
      "/admin/subscriptions",
    );
    expect(
      screen.getByLabelText(/Verified email or mobile number/),
    ).toBeInTheDocument();
  });

  it("keeps what was searched for, so the field is not cleared", () => {
    render(<AccountLookupForm value="owner@example.com" />);

    expect(screen.getByLabelText(/Verified email or mobile number/)).toHaveValue(
      "owner@example.com",
    );
  });

  it("says there is no partial search", () => {
    render(<AccountLookupForm value="" />);

    expect(screen.getByText(/no partial search/)).toBeInTheDocument();
  });
});
