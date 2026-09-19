import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InventoryToolbar } from "../../../../apps/web/src/features/inventory/inventory-toolbar";

describe("InventoryToolbar", () => {
  it("preserves shareable filter/view state in an accessible search form", () => {
    render(
      <InventoryToolbar
        query={{
          filter: "PROCESSING",
          limit: 24,
          query: "Audi",
          sort: "NAME_ASC",
          view: "LIST",
        }}
      />,
    );

    expect(screen.getByRole("searchbox", { name: "Search inventory" }))
      .toHaveValue("Audi");
    expect(screen.getByRole("combobox", { name: "Sort inventory" }))
      .toHaveValue("NAME_ASC");
    expect(screen.getByRole("link", { name: "List view" }))
      .toHaveAttribute("aria-current", "page");
    expect(screen.getByDisplayValue("PROCESSING")).toHaveAttribute(
      "type",
      "hidden",
    );
  });
});
