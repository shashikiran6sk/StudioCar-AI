import type {
  InventoryFilterCounts,
  InventoryQuery,
} from "@studiocar/contracts";
import Link from "next/link";

import { createInventoryHref } from "./create-inventory-href";
import { INVENTORY_FILTERS } from "./inventory.constants";

export interface InventoryFilterBarProps {
  counts: InventoryFilterCounts;
  query: InventoryQuery;
}

export function InventoryFilterBar({ counts, query }: InventoryFilterBarProps) {
  return (
    <nav aria-label="Inventory status" className="inventory-filters">
      {INVENTORY_FILTERS.map((filter) => (
        <Link
          aria-current={query.filter === filter.value ? "page" : undefined}
          className="inventory-filter"
          href={createInventoryHref(query, {
            cursor: undefined,
            filter: filter.value,
          })}
          key={filter.value}
        >
          {filter.label} {counts[filter.countKey]}
        </Link>
      ))}
    </nav>
  );
}
