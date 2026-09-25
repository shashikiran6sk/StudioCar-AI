"use client";

import type { InventoryPage, InventoryQuery, InventorySearchQuery } from "@studiocar/contracts";
import { Button, StatePanel } from "@studiocar/ui";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createInventoryHref } from "./create-inventory-href";
import { createInventorySearchUrl } from "./create-inventory-search-url";
import { InventoryEmptyState } from "./inventory-empty-state";
import { InventoryFilterBar } from "./inventory-filter-bar";
import { InventoryGrid } from "./inventory-grid";
import { InventorySearchEmptyState } from "./inventory-search-empty-state";
import { InventoryToolbar } from "./inventory-toolbar";
import {
  INVENTORY_NEXT_PAGE_LABEL,
  INVENTORY_SEARCH_DEBOUNCE_MS,
  INVENTORY_SEARCH_ERROR_DESCRIPTION,
  INVENTORY_SEARCH_ERROR_TITLE,
  INVENTORY_SEARCH_RETRY_LABEL,
  INVENTORY_SEARCHING_LABEL,
} from "./inventory.constants";
import { useDebouncedValue } from "./use-debounced-value";
import { useInventorySearch } from "./use-inventory-search";

export interface InventoryExplorerProps {
  choosing: boolean;
  initialPage: InventoryPage;
  query: InventoryQuery;
}

export function InventoryExplorer({ choosing, initialPage, query }: InventoryExplorerProps) {
  const router = useRouter();
  const [searchText, setSearchText] = useState(query.query ?? "");
  const [searchResetKey, setSearchResetKey] = useState(0);
  const term = searchText.trim();
  const debouncedTerm = useDebouncedValue(searchText, INVENTORY_SEARCH_DEBOUNCE_MS, searchResetKey).trim();
  const cursor = term === (query.query ?? "") ? query.cursor : undefined;
  const liveQuery: InventoryQuery = {
    ...query,
    ...(cursor ? { cursor } : { cursor: undefined }),
    query: term || undefined,
  };
  const searchQuery: InventorySearchQuery | null = debouncedTerm
    ? {
        ...(cursor ? { cursor } : {}),
        limit: query.limit,
        mode: query.mode,
        q: debouncedTerm,
        sort: query.sort,
        status: query.filter,
      }
    : null;
  const searchUrl = searchQuery ? createInventorySearchUrl(searchQuery) : null;
  const search = useInventorySearch(searchUrl);
  const searchReady = term !== "" && term === debouncedTerm && search.key === searchUrl && !search.loading;
  const resultPage = searchReady ? search.page : null;
  const searching = term !== "" && (!searchReady || search.loading);
  const activePage = term ? resultPage : initialPage;

  useEffect(() => {
    if (term !== debouncedTerm || term === (query.query ?? "")) return;
    window.history.replaceState(null, "", createInventoryHref(query, {
      cursor: undefined,
      query: term || undefined,
    }));
  }, [debouncedTerm, query, term]);

  function changeSearch(value: string) {
    if (!value) setSearchResetKey((current) => current + 1);
    setSearchText(value);
  }

  function clearSearch() {
    changeSearch("");
    const href = createInventoryHref(query, { cursor: undefined, query: undefined });
    if (query.cursor) router.replace(href);
    else window.history.replaceState(null, "", href);
  }

  return (
    <>
      <InventoryToolbar
        onClear={clearSearch}
        onSearchChange={changeSearch}
        query={liveQuery}
        searching={searching}
        searchText={searchText}
      />
      {choosing ? null : <InventoryFilterBar counts={activePage?.counts ?? initialPage.counts} query={liveQuery} />}
      {searching ? (
        <p className="inventory-search-status" role="status">{INVENTORY_SEARCHING_LABEL}</p>
      ) : searchReady && search.error ? (
        <StatePanel
          action={<Button onClick={search.retry} type="button">{INVENTORY_SEARCH_RETRY_LABEL}</Button>}
          description={INVENTORY_SEARCH_ERROR_DESCRIPTION}
          icon={<span aria-hidden="true">!</span>}
          title={INVENTORY_SEARCH_ERROR_TITLE}
        />
      ) : activePage && activePage.items.length > 0 ? (
        <InventoryGrid
          items={activePage.items}
          selectHref={choosing ? (vehicleId) => createInventoryHref(liveQuery, {}, vehicleId) : undefined}
          view={query.view}
        />
      ) : term ? (
        <InventorySearchEmptyState onClear={clearSearch} query={term} />
      ) : (
        <InventoryEmptyState choosing={choosing} filtered={query.filter !== "ALL"} />
      )}
      {activePage?.nextCursor && !searching ? (
        <a
          className="sc-button sc-button--secondary inventory-page__next"
          href={createInventoryHref(liveQuery, { cursor: activePage.nextCursor })}
        >
          {INVENTORY_NEXT_PAGE_LABEL}
        </a>
      ) : null}
    </>
  );
}
