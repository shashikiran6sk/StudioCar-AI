import type { InventorySearchQuery } from "@studiocar/contracts";

import { INVENTORY_PAGE_LIMIT, INVENTORY_SEARCH_ROUTE } from "./inventory.constants";

export function createInventorySearchUrl(query: InventorySearchQuery): string {
  const parameters = new URLSearchParams({ q: query.q });
  if (query.status !== "ALL") parameters.set("status", query.status);
  if (query.sort !== "CREATED_DESC") parameters.set("sort", query.sort);
  if (query.mode !== "BROWSE") parameters.set("mode", query.mode);
  if (query.cursor) parameters.set("cursor", query.cursor);
  if (query.limit !== INVENTORY_PAGE_LIMIT) parameters.set("limit", String(query.limit));
  return `${INVENTORY_SEARCH_ROUTE}?${parameters}`;
}
