import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DashboardLoading from "../../../../../apps/web/src/app/(app)/dashboard/loading";

describe("DashboardLoading", () => {
  it("preserves dashboard geometry while data loads", () => {
    render(<DashboardLoading />);

    expect(
      screen.getByRole("status", { name: "Loading dashboard" }),
    ).toBeInTheDocument();
  });
});
