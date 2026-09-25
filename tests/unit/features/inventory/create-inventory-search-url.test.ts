import { describe, expect, it } from "vitest";

import { createInventorySearchUrl } from "../../../../apps/web/src/features/inventory/create-inventory-search-url";

describe("createInventorySearchUrl", () => {
  it("targets the dedicated endpoint and preserves status, sort, mode and cursor", () => {
    expect(createInventorySearchUrl({
      cursor: "4bb7fa89-c907-4458-9786-8aafc2235728",
      limit: 12,
      mode: "CREATE_STUDIO",
      q: "Porsche 911",
      sort: "NAME_ASC",
      status: "COMPLETED",
    })).toBe("/api/inventory/search?q=Porsche+911&status=COMPLETED&sort=NAME_ASC&mode=CREATE_STUDIO&cursor=4bb7fa89-c907-4458-9786-8aafc2235728&limit=12");
  });
});
