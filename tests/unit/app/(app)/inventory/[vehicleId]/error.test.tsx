import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import VehiclePortfolioError from "../../../../../../apps/web/src/app/(app)/inventory/[vehicleId]/error";

describe("VehiclePortfolioError", () => {
  it("offers a recovery action without exposing exception details", () => {
    const reset = vi.fn();
    render(<VehiclePortfolioError error={new Error("private storage error")} reset={reset} />);

    expect(screen.queryByText("private storage error")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
