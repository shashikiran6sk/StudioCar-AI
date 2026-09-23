import type { InventoryQuery } from "@studiocar/contracts";
import { Button } from "@studiocar/ui";
import Link from "next/link";

import { INVENTORY_PATH } from "../../app/app-routes";
import { createInventoryHref } from "./create-inventory-href";
import {
  INVENTORY_APPLY_LABEL,
  INVENTORY_MODE_QUERY_KEY,
  INVENTORY_SEARCH_LABEL,
  INVENTORY_SEARCH_PLACEHOLDER,
  INVENTORY_SORT_OPTIONS,
  INVENTORY_VIEWS,
} from "./inventory.constants";

export interface InventoryToolbarProps {
  query: InventoryQuery;
}

export function InventoryToolbar({ query }: InventoryToolbarProps) {
  return (
    <div className="inventory-toolbar">
      <form action={INVENTORY_PATH} className="inventory-toolbar__form" method="get">
        <label className="sc-visually-hidden" htmlFor="inventory-search">
          {INVENTORY_SEARCH_LABEL}
        </label>
        <input
          className="sc-input inventory-toolbar__search"
          defaultValue={query.query}
          id="inventory-search"
          name="query"
          placeholder={INVENTORY_SEARCH_PLACEHOLDER}
          type="search"
        />
        <label className="sc-visually-hidden" htmlFor="inventory-sort">
          Sort inventory
        </label>
        <select
          className="inventory-toolbar__select"
          defaultValue={query.sort}
          id="inventory-sort"
          name="sort"
        >
          {INVENTORY_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {query.filter !== "ALL" ? (
          <input name="filter" type="hidden" value={query.filter} />
        ) : null}
        {query.mode !== "BROWSE" ? (
          <input name={INVENTORY_MODE_QUERY_KEY} type="hidden" value={query.mode} />
        ) : null}
        {query.view !== "GRID" ? (
          <input name="view" type="hidden" value={query.view} />
        ) : null}
        <Button size="small" type="submit">
          {INVENTORY_APPLY_LABEL}
        </Button>
      </form>
      <div aria-label="Inventory layout" className="inventory-toolbar__views">
        {INVENTORY_VIEWS.map((view) => (
          <Link
            aria-current={query.view === view.value ? "page" : undefined}
            aria-label={view.label}
            className="inventory-toolbar__view"
            href={createInventoryHref(query, {
              cursor: undefined,
              view: view.value,
            })}
            key={view.value}
          >
            <span aria-hidden="true">{view.symbol}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
