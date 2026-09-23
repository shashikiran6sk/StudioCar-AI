import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InventoryCard } from "../../../../apps/web/src/features/inventory/inventory-card";

const BASE_ITEM = {
  brand: "Audi",
  completedImageCount: 13,
  createdAt: "2026-09-18T10:00:00.000Z",
  failedImageCount: 0,
  hasCompletedOutput: false,
  id: "4bb7fa89-c907-4458-9786-8aafc2235728",
  imageCount: 20,
  model: "Q5",
  name: "2026 Audi Q5",
  previewUrl: null,
  status: "PROCESSING",
  stockId: "SC-100",
  year: 2026,
} satisfies Parameters<typeof InventoryCard>[0]["item"];

describe("InventoryCard", () => {
  it("shows count-derived processing progress without provider fiction", () => {
    render(<InventoryCard item={BASE_ITEM} />);

    expect(screen.getByRole("heading", { name: "2026 Audi Q5" })).toBeVisible();
    expect(screen.getByText("Processing")).toBeVisible();
    expect(screen.getByText("65%")).toBeVisible();
    expect(screen.getByRole("progressbar", { name: "13 of 20 images complete" }))
      .toHaveAttribute("aria-valuenow", "65");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("keeps earlier studio versions reachable while a new one processes", () => {
    render(
      <InventoryCard
        item={{ ...BASE_ITEM, completedImageCount: 0, hasCompletedOutput: true }}
      />,
    );

    expect(screen.getByRole("link", { name: /Open portfolio/ })).toHaveAttribute(
      "href",
      `/inventory/${BASE_ITEM.id}`,
    );
  });

  it("presents partial failures with counts and a way to review them", () => {
    render(
      <InventoryCard
        item={{
          ...BASE_ITEM,
          completedImageCount: 18,
          failedImageCount: 2,
          hasCompletedOutput: true,
          status: "FAILED",
        }}
      />,
    );

    expect(screen.getByText("Needs attention")).toBeVisible();
    expect(screen.getByText(/18 of 20 images complete/)).toBeVisible();
    expect(screen.getByText(/2 images need attention/)).toBeVisible();
    expect(screen.getByRole("link", { name: /Review issues/ })).toHaveAttribute(
      "href",
      `/inventory/${BASE_ITEM.id}#attention`,
    );
  });

  it("offers a failed vehicle for review even when nothing completed", () => {
    render(
      <InventoryCard
        item={{
          ...BASE_ITEM,
          completedImageCount: 0,
          failedImageCount: 20,
          status: "FAILED",
        }}
      />,
    );

    expect(screen.getByRole("link", { name: /Review issues/ })).toBeVisible();
  });

  it("opens the Selection Dialog while choosing a vehicle for a new version", () => {
    render(
      <InventoryCard
        item={{
          ...BASE_ITEM,
          completedImageCount: 20,
          hasCompletedOutput: true,
          status: "COMPLETED",
        }}
        selectHref="/inventory?mode=CREATE_STUDIO&vehicle=4bb7fa89-c907-4458-9786-8aafc2235728"
      />,
    );

    expect(screen.getByRole("link", { name: /Create images/ })).toHaveAttribute(
      "href",
      "/inventory?mode=CREATE_STUDIO&vehicle=4bb7fa89-c907-4458-9786-8aafc2235728",
    );
    expect(
      screen.queryByRole("link", { name: /Open portfolio/ }),
    ).not.toBeInTheDocument();
  });
});
