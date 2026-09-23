import { describe, expect, it } from "vitest";

import { createInventoryHref } from "../../../../apps/web/src/features/inventory/create-inventory-href";
import {
  INVENTORY_CREATE_STUDIO_HREF,
  INVENTORY_NEEDS_ATTENTION_HREF,
} from "../../../../apps/web/src/features/inventory/inventory.constants";

const defaults = {
  filter: "ALL",
  limit: 24,
  mode: "BROWSE",
  sort: "CREATED_DESC",
  view: "GRID",
} as const;

describe("createInventoryHref", () => {
  it("preserves search and sort while resetting the cursor for filter changes", () => {
    expect(
      createInventoryHref(
        { ...defaults, cursor: "cursor-1", query: "BMW", sort: "NAME_ASC" },
        { cursor: undefined, filter: "COMPLETED" },
      ),
    ).toBe("/inventory?query=BMW&filter=COMPLETED&sort=NAME_ASC");
  });

  it("omits default state from canonical inventory links", () => {
    expect(createInventoryHref(defaults, {})).toBe("/inventory");
  });

  it("keeps the create-studio mode and names the chosen vehicle", () => {
    expect(
      createInventoryHref(
        { ...defaults, mode: "CREATE_STUDIO", query: "BMW" },
        {},
        "0e879f46-1193-4d77-b785-057fe026d998",
      ),
    ).toBe(
      "/inventory?mode=CREATE_STUDIO&query=BMW&vehicle=0e879f46-1193-4d77-b785-057fe026d998",
    );
  });

  it("agrees with the dashboard's fixed Inventory links", () => {
    expect(createInventoryHref({ ...defaults, mode: "CREATE_STUDIO" }, {})).toBe(
      INVENTORY_CREATE_STUDIO_HREF,
    );
    expect(
      createInventoryHref({ ...defaults, filter: "NEEDS_ATTENTION" }, {}),
    ).toBe(INVENTORY_NEEDS_ATTENTION_HREF);
  });
});
