import type { InventoryItem, InventoryView } from "@studiocar/contracts";

import { InventoryCard } from "./inventory-card";

export interface InventoryGridProps {
  items: InventoryItem[];
  /** Builds each card's Selection Dialog link while choosing a vehicle. */
  selectHref?: ((vehicleId: string) => string) | undefined;
  view: InventoryView;
}

export function InventoryGrid({ items, selectHref, view }: InventoryGridProps) {
  return (
    <div
      className={`inventory-grid inventory-grid--${view.toLowerCase()}`}
      data-testid="inventory-grid"
    >
      {items.map((item) => (
        <InventoryCard
          item={item}
          key={item.id}
          selectHref={selectHref?.(item.id)}
        />
      ))}
    </div>
  );
}
