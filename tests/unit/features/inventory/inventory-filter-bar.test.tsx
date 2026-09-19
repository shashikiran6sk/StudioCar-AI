import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InventoryFilterBar } from "../../../../apps/web/src/features/inventory/inventory-filter-bar";

describe("InventoryFilterBar", () => {
  it("shows live aggregate counts and retains the current search", () => {
    render(
      <InventoryFilterBar
        counts={{ all: 24, archived: 1, completed: 19, failed: 1, processing: 3 }}
        query={{
          filter: "ALL",
          limit: 24,
          query: "BMW",
          sort: "CREATED_DESC",
          view: "GRID",
        }}
      />,
    );

    expect(screen.getByRole("link", { name: "All 24" }))
      .toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Processing 3" }))
      .toHaveAttribute("href", "/inventory?query=BMW&filter=PROCESSING");
  });
});
