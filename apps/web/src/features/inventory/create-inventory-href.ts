import type { InventoryQuery } from "@studiocar/contracts";

import { INVENTORY_PATH } from "../../app/app-routes";

export function createInventoryHref(
  current: InventoryQuery,
  updates: Partial<InventoryQuery>,
): string {
  const next: InventoryQuery = { ...current, ...updates };
  const parameters = new URLSearchParams();
  if (next.query) parameters.set("query", next.query);
  if (next.filter !== "ALL") parameters.set("filter", next.filter);
  if (next.sort !== "CREATED_DESC") parameters.set("sort", next.sort);
  if (next.view !== "GRID") parameters.set("view", next.view);
  if (next.cursor) parameters.set("cursor", next.cursor);
  const queryString = parameters.toString();
  return queryString ? `${INVENTORY_PATH}?${queryString}` : INVENTORY_PATH;
}
