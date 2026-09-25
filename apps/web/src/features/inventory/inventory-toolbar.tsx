"use client";

import type { InventoryQuery } from "@studiocar/contracts";
import { VehicleSortSchema } from "@studiocar/contracts";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createInventoryHref } from "./create-inventory-href";
import {
  INVENTORY_CLEAR_SEARCH_LABEL,
  INVENTORY_SEARCH_LABEL,
  INVENTORY_SEARCH_MAX_LENGTH,
  INVENTORY_SEARCH_PLACEHOLDER,
  INVENTORY_SEARCHING_LABEL,
  INVENTORY_SORT_OPTIONS,
  INVENTORY_VIEWS,
} from "./inventory.constants";

export interface InventoryToolbarProps {
  onClear: () => void;
  onSearchChange: (value: string) => void;
  query: InventoryQuery;
  searching: boolean;
  searchText: string;
}

export function InventoryToolbar({ onClear, onSearchChange, query, searching, searchText }: InventoryToolbarProps) {
  const router = useRouter();

  return (
    <div className="inventory-toolbar">
      <div className="inventory-toolbar__form">
        <label className="sc-visually-hidden" htmlFor="inventory-search">
          {INVENTORY_SEARCH_LABEL}
        </label>
        <div className="inventory-toolbar__search-wrap">
          <svg aria-hidden="true" className="inventory-toolbar__search-icon" fill="none" viewBox="0 0 24 24">
            <circle cx="10.8" cy="10.8" r="6.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="m15.6 15.6 5 5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          </svg>
          <input
            className="sc-input inventory-toolbar__search"
            id="inventory-search"
            maxLength={INVENTORY_SEARCH_MAX_LENGTH}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={INVENTORY_SEARCH_PLACEHOLDER}
            type="search"
            value={searchText}
          />
          {searching ? <span aria-label={INVENTORY_SEARCHING_LABEL} className="inventory-toolbar__spinner" role="status" /> : null}
          {searchText ? (
            <button aria-label={INVENTORY_CLEAR_SEARCH_LABEL} className="inventory-toolbar__clear" onClick={onClear} type="button">×</button>
          ) : null}
        </div>
        <label className="sc-visually-hidden" htmlFor="inventory-sort">
          Sort inventory
        </label>
        <select
          className="inventory-toolbar__select"
          id="inventory-sort"
          onChange={(event) => {
            const sort = VehicleSortSchema.safeParse(event.target.value);
            if (sort.success) router.push(createInventoryHref(query, { cursor: undefined, sort: sort.data }));
          }}
          value={query.sort}
        >
          {INVENTORY_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
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
