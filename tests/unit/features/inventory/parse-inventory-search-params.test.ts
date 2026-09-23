import { describe, expect, it } from "vitest";

import { parseInventorySearchParams } from "../../../../apps/web/src/features/inventory/parse-inventory-search-params";

describe("parseInventorySearchParams", () => {
  it("parses valid URL state with the bounded product page size", () => {
    expect(
      parseInventorySearchParams({
        cursor: "4bb7fa89-c907-4458-9786-8aafc2235728",
        filter: "PROCESSING",
        query: "  BMW ",
        sort: "NAME_ASC",
        view: "LIST",
      }),
    ).toEqual({
      cursor: "4bb7fa89-c907-4458-9786-8aafc2235728",
      filter: "PROCESSING",
      limit: 24,
      mode: "BROWSE",
      query: "BMW",
      sort: "NAME_ASC",
      view: "LIST",
    });
  });

  it("reads the needs-attention filter and the create-studio mode", () => {
    expect(
      parseInventorySearchParams({ filter: "NEEDS_ATTENTION" }),
    ).toMatchObject({ filter: "NEEDS_ATTENTION", mode: "BROWSE" });
    expect(
      parseInventorySearchParams({ mode: "CREATE_STUDIO" }),
    ).toMatchObject({ filter: "ALL", mode: "CREATE_STUDIO" });
  });

  it("falls back safely when URL state is invalid or repeated", () => {
    expect(
      parseInventorySearchParams({ filter: "UNKNOWN", query: ["one", "two"] }),
    ).toEqual({
      filter: "ALL",
      limit: 24,
      mode: "BROWSE",
      sort: "CREATED_DESC",
      view: "GRID",
    });
  });
});
