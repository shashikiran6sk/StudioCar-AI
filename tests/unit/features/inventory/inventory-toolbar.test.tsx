import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { InventoryToolbar } from "../../../../apps/web/src/features/inventory/inventory-toolbar";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

describe("InventoryToolbar", () => {
  it("shows accessible search and view controls without an Apply button", () => {
    render(
      <InventoryToolbar
        onClear={vi.fn()}
        onSearchChange={vi.fn()}
        query={{
          filter: "PROCESSING",
          limit: 24,
          mode: "BROWSE",
          query: "Audi",
          sort: "NAME_ASC",
          view: "LIST",
        }}
        searching={false}
        searchText="Audi"
      />,
    );

    expect(screen.getByRole("searchbox", { name: "Search vehicles by name or reference" }))
      .toHaveValue("Audi");
    expect(screen.getByRole("combobox", { name: "Sort inventory" }))
      .toHaveValue("NAME_ASC");
    expect(screen.getByRole("link", { name: "List view" }))
      .toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("button", { name: "Apply" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear search" })).toBeVisible();
  });

  it("updates sorting immediately while keeping the search and mode", () => {
    render(
      <InventoryToolbar
        onClear={vi.fn()}
        onSearchChange={vi.fn()}
        query={{
          filter: "ALL",
          limit: 24,
          mode: "CREATE_STUDIO",
          query: "Porsche",
          sort: "CREATED_DESC",
          view: "GRID",
        }}
        searching={false}
        searchText="Porsche"
      />,
    );

    fireEvent.change(screen.getByRole("combobox", { name: "Sort inventory" }), {
      target: { value: "NAME_ASC" },
    });
    expect(push).toHaveBeenCalledWith("/inventory?mode=CREATE_STUDIO&query=Porsche&sort=NAME_ASC");
  });
});
