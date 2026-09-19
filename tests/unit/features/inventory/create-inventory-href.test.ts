import { describe, expect, it } from "vitest";

import { createInventoryHref } from "../../../../apps/web/src/features/inventory/create-inventory-href";

describe("createInventoryHref", () => {
  it("preserves search and sort while resetting the cursor for filter changes", () => {
    expect(
      createInventoryHref(
        {
          cursor: "cursor-1",
          filter: "ALL",
          limit: 24,
          query: "BMW",
          sort: "NAME_ASC",
          view: "GRID",
        },
        { cursor: undefined, filter: "COMPLETED" },
      ),
    ).toBe("/inventory?query=BMW&filter=COMPLETED&sort=NAME_ASC");
  });

  it("omits default state from canonical inventory links", () => {
    expect(
      createInventoryHref(
        { filter: "ALL", limit: 24, sort: "CREATED_DESC", view: "GRID" },
        {},
      ),
    ).toBe("/inventory");
  });
});
