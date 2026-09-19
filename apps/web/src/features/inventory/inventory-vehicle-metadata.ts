import type { InventoryItem } from "@studiocar/contracts";

export function inventoryVehicleMetadata(
  item: Pick<InventoryItem, "brand" | "model" | "year">,
): string {
  return [item.brand, item.model, item.year ? String(item.year) : null]
    .filter((value) => value !== null)
    .join(" · ");
}
