import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InventoryGrid } from "../../../../apps/web/src/features/inventory/inventory-grid";

describe("InventoryGrid", () => {
  it("renders the explicit list variant without changing card semantics", () => {
    render(
      <InventoryGrid
        items={[
          {
            brand: null,
            completedImageCount: 1,
            createdAt: "2026-09-18T10:00:00.000Z",
            failedImageCount: 0,
            hasCompletedOutput: true,
            id: "4bb7fa89-c907-4458-9786-8aafc2235728",
            imageCount: 1,
            model: null,
            name: "Vehicle one",
            previewUrl: null,
            status: "COMPLETED",
            stockId: null,
            year: null,
          },
        ]}
        view="LIST"
      />,
    );

    expect(screen.getByTestId("inventory-grid")).toHaveClass(
      "inventory-grid--list",
    );
    expect(screen.getByRole("article")).toBeVisible();
  });

  it("gives each card its selection link while choosing a vehicle", () => {
    render(
      <InventoryGrid
        items={[
          {
            brand: null,
            completedImageCount: 1,
            createdAt: "2026-09-18T10:00:00.000Z",
            failedImageCount: 0,
            hasCompletedOutput: true,
            id: "4bb7fa89-c907-4458-9786-8aafc2235728",
            imageCount: 1,
            model: null,
            name: "Vehicle one",
            previewUrl: null,
            status: "COMPLETED",
            stockId: null,
            year: null,
          },
        ]}
        selectHref={(vehicleId) => `/inventory?vehicle=${vehicleId}`}
        view="GRID"
      />,
    );

    expect(screen.getByRole("link", { name: /Create images/ })).toHaveAttribute(
      "href",
      "/inventory?vehicle=4bb7fa89-c907-4458-9786-8aafc2235728",
    );
  });
});
