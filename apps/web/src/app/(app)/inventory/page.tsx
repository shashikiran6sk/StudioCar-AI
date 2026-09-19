import { redirect } from "next/navigation";

import { LOGIN_PATH } from "../../app-routes";
import { createInventoryHref } from "../../../features/inventory/create-inventory-href";
import { InventoryEmptyState } from "../../../features/inventory/inventory-empty-state";
import { InventoryFilterBar } from "../../../features/inventory/inventory-filter-bar";
import { InventoryGrid } from "../../../features/inventory/inventory-grid";
import {
  INVENTORY_DESCRIPTION,
  INVENTORY_EYEBROW,
  INVENTORY_NEXT_PAGE_LABEL,
  INVENTORY_TITLE,
} from "../../../features/inventory/inventory.constants";
import {
  parseInventorySearchParams,
  type InventorySearchParams,
} from "../../../features/inventory/parse-inventory-search-params";
import { InventoryToolbar } from "../../../features/inventory/inventory-toolbar";
import { VehicleCreateLauncher } from "../../../features/vehicle-create/vehicle-create-launcher";
import { getCurrentSession } from "../../../server/auth/get-current-session";
import { getInventoryService } from "../../../server/inventory/inventory-runtime";

export const dynamic = "force-dynamic";

export interface InventoryPageProps {
  searchParams: Promise<InventorySearchParams>;
}

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const session = await getCurrentSession();
  if (!session) redirect(LOGIN_PATH);

  const query = parseInventorySearchParams(await searchParams);
  const page = await getInventoryService().list(session.userId, query);
  const filtered = Boolean(query.query) || query.filter !== "ALL";

  return (
    <div className="inventory-page">
      <header className="app-page-header">
        <div>
          <p className="eyebrow">{INVENTORY_EYEBROW}</p>
          <h1>{INVENTORY_TITLE}</h1>
          <p>{INVENTORY_DESCRIPTION}</p>
        </div>
        <VehicleCreateLauncher />
      </header>
      <InventoryToolbar query={query} />
      <InventoryFilterBar counts={page.counts} query={query} />
      {page.items.length > 0 ? (
        <InventoryGrid items={page.items} view={query.view} />
      ) : (
        <InventoryEmptyState filtered={filtered} />
      )}
      {page.nextCursor ? (
        <a
          className="sc-button sc-button--secondary inventory-page__next"
          href={createInventoryHref(query, { cursor: page.nextCursor })}
        >
          {INVENTORY_NEXT_PAGE_LABEL}
        </a>
      ) : null}
    </div>
  );
}
