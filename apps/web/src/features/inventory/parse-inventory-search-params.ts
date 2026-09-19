import {
  InventoryQuerySchema,
  type InventoryQuery,
} from "@studiocar/contracts";

import { INVENTORY_PAGE_LIMIT } from "./inventory.constants";

export type InventorySearchParams = Record<
  string,
  string | string[] | undefined
>;

export function parseInventorySearchParams(
  searchParams: InventorySearchParams,
): InventoryQuery {
  const result = InventoryQuerySchema.safeParse({
    cursor:
      typeof searchParams["cursor"] === "string"
        ? searchParams["cursor"]
        : undefined,
    filter:
      typeof searchParams["filter"] === "string"
        ? searchParams["filter"]
        : undefined,
    limit: INVENTORY_PAGE_LIMIT,
    query:
      typeof searchParams["query"] === "string"
        ? searchParams["query"]
        : undefined,
    sort:
      typeof searchParams["sort"] === "string"
        ? searchParams["sort"]
        : undefined,
    view:
      typeof searchParams["view"] === "string"
        ? searchParams["view"]
        : undefined,
  });

  return result.success
    ? result.data
    : InventoryQuerySchema.parse({ limit: INVENTORY_PAGE_LIMIT });
}
