import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InventoryCard } from "../../../../apps/web/src/features/inventory/inventory-card";

const BASE_ITEM = {
  brand: "Audi",
  completedImageCount: 13,
  createdAt: "2026-09-18T10:00:00.000Z",
  failedImageCount: 0,
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
  });

  it("presents partial failures with redundant visible counts", () => {
    render(
      <InventoryCard
        item={{
          ...BASE_ITEM,
          completedImageCount: 18,
          failedImageCount: 2,
          status: "FAILED",
        }}
      />,
    );

    expect(screen.getByText("Needs attention")).toBeVisible();
    expect(screen.getByText(/18 of 20 images complete/)).toBeVisible();
    expect(screen.getByText(/2 images need attention/)).toBeVisible();
  });
});
