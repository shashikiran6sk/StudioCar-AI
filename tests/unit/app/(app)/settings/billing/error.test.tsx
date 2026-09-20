import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import UsageBillingError from "../../../../../../apps/web/src/app/(app)/settings/billing/error";

describe("UsageBillingError", () => {
  it("offers safe retry without implying data loss", () => {
    const reset = vi.fn();
    render(<UsageBillingError error={new Error("offline")} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledOnce();
    expect(screen.getByText(/plan and processed images are safe/)).toBeInTheDocument();
  });
});
