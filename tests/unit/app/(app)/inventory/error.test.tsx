import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import InventoryError from "../../../../../apps/web/src/app/(app)/inventory/error";

describe("InventoryError", () => {
  it("explains that inventory is safe and retries on request", () => {
    const reset = vi.fn();
    render(<InventoryError error={new Error("database unavailable")} reset={reset} />);

    expect(screen.getByText("Your vehicles are safe. Try loading the inventory again."))
      .toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
