import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PrintReceiptAction } from "../../../../apps/web/src/features/billing/print-receipt-action";

describe("PrintReceiptAction", () => {
  it("uses browser printing for PDF saving", () => {
    const print = vi.fn();
    vi.stubGlobal("print", print);
    render(<PrintReceiptAction />);
    fireEvent.click(screen.getByRole("button", { name: "Print Receipt" }));
    expect(print).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});
