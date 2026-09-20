import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardStatCard } from "../../../../apps/web/src/features/dashboard/dashboard-stat-card";

describe("DashboardStatCard", () => {
  it("renders the label, value, and supporting context", () => {
    render(
      <DashboardStatCard
        inverted
        label="Usage remaining"
        supportingText="images · Free plan"
        value="8"
      />,
    );

    expect(screen.getByText("Usage remaining")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("images · Free plan")).toBeInTheDocument();
  });
});
