import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardQuickActionCard } from "../../../../apps/web/src/features/dashboard/dashboard-quick-action-card";

function renderCard() {
  render(
    <DashboardQuickActionCard
      action={<a href="/inventory">Open</a>}
      description="Manage vehicle image batches."
      imageAlt="Three vehicles side by side, representing your inventory."
      imageLabel="Live"
      imagePath="/images/dashboard/vehicle-inventory.webp"
      status={<span>2 processing</span>}
      title="View inventory"
    />,
  );
}

describe("DashboardQuickActionCard", () => {
  it("keeps action meaning and context discoverable", () => {
    renderCard();

    expect(
      screen.getByRole("heading", { name: "View inventory" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 processing")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open" })).toHaveAttribute(
      "href",
      "/inventory",
    );
  });

  it("describes its own imagery rather than hiding it", () => {
    renderCard();

    const image = screen.getByRole("img", {
      name: "Three vehicles side by side, representing your inventory.",
    });
    expect(image).toBeInTheDocument();
    expect(image).not.toHaveAttribute("aria-hidden");
  });

  it("renders the image supplied for this action", () => {
    renderCard();

    expect(
      screen.getByRole("img", { name: /inventory/ }).getAttribute("src"),
    ).toContain("vehicle-inventory.webp");
  });
});
