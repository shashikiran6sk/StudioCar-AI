import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardQuickActionCard } from "../../../../apps/web/src/features/dashboard/dashboard-quick-action-card";

describe("DashboardQuickActionCard", () => {
  it("keeps action meaning and context discoverable", () => {
    render(
      <DashboardQuickActionCard
        action={<a href="/inventory">Open</a>}
        description="Manage vehicle image batches."
        imageLabel="Live"
        status={<span>2 processing</span>}
        title="View inventory"
      />,
    );

    expect(screen.getByRole("heading", { name: "View inventory" })).toBeInTheDocument();
    expect(screen.getByText("2 processing")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open" })).toHaveAttribute(
      "href",
      "/inventory",
    );
  });
});
