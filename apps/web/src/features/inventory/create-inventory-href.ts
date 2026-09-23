import type { InventoryQuery } from "@studiocar/contracts";

import { INVENTORY_PATH } from "../../app/app-routes";
import {
  INVENTORY_MODE_QUERY_KEY,
  INVENTORY_VEHICLE_QUERY_KEY,
} from "./inventory.constants";

/**
 * An Inventory URL that keeps the current search, filter, sort, view and
 * mode. `vehicleId` opens the Selection Dialog on that vehicle while choosing
 * one for a new studio version.
 */
export function createInventoryHref(
  current: InventoryQuery,
  updates: Partial<InventoryQuery>,
  vehicleId?: string,
): string {
  const next: InventoryQuery = { ...current, ...updates };
  const parameters = new URLSearchParams();
  if (next.mode !== "BROWSE") {
    parameters.set(INVENTORY_MODE_QUERY_KEY, next.mode);
  }
  if (next.query) parameters.set("query", next.query);
  if (next.filter !== "ALL") parameters.set("filter", next.filter);
  if (next.sort !== "CREATED_DESC") parameters.set("sort", next.sort);
  if (next.view !== "GRID") parameters.set("view", next.view);
  if (next.cursor) parameters.set("cursor", next.cursor);
  if (vehicleId) parameters.set(INVENTORY_VEHICLE_QUERY_KEY, vehicleId);
  const queryString = parameters.toString();
  return queryString ? `${INVENTORY_PATH}?${queryString}` : INVENTORY_PATH;
}
