import type { InventoryItem, InventoryView } from "@studiocar/contracts";

import { InventoryCard } from "./inventory-card";

export interface InventoryGridProps {
  items: InventoryItem[];
  view: InventoryView;
}

export function InventoryGrid({ items, view }: InventoryGridProps) {
  return (
    <div
      className={`inventory-grid inventory-grid--${view.toLowerCase()}`}
      data-testid="inventory-grid"
    >
      {items.map((item) => (
        <InventoryCard item={item} key={item.id} />
      ))}
    </div>
  );
}
