import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DashboardError from "../../../../../apps/web/src/app/(app)/dashboard/error";

describe("DashboardError", () => {
  it("explains data safety and retries the route", () => {
    const reset = vi.fn();
    render(<DashboardError error={new Error("database unavailable")} reset={reset} />);

    expect(
      screen.getByText("Your vehicles and processing jobs are safe. Try loading the workspace again."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
