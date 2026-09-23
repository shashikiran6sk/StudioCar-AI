import { EntityIdSchema } from "@studiocar/contracts";
import { ButtonLink } from "@studiocar/ui";
import { redirect } from "next/navigation";

import { INVENTORY_PATH, LOGIN_PATH } from "../../app-routes";
import { createInventoryHref } from "../../../features/inventory/create-inventory-href";
import { InventoryEmptyState } from "../../../features/inventory/inventory-empty-state";
import { InventoryFilterBar } from "../../../features/inventory/inventory-filter-bar";
import { InventoryGrid } from "../../../features/inventory/inventory-grid";
import {
  INVENTORY_CREATE_STUDIO_DESCRIPTION,
  INVENTORY_CREATE_STUDIO_EXIT_LABEL,
  INVENTORY_CREATE_STUDIO_EYEBROW,
  INVENTORY_CREATE_STUDIO_TITLE,
  INVENTORY_DESCRIPTION,
  INVENTORY_EYEBROW,
  INVENTORY_NEXT_PAGE_LABEL,
  INVENTORY_TITLE,
  INVENTORY_VEHICLE_QUERY_KEY,
} from "../../../features/inventory/inventory.constants";
import {
  parseInventorySearchParams,
  type InventorySearchParams,
} from "../../../features/inventory/parse-inventory-search-params";
import { InventoryToolbar } from "../../../features/inventory/inventory-toolbar";
import { PORTFOLIO_STUDIO_UNAVAILABLE_MESSAGE } from "../../../features/portfolio/portfolio.constants";
import { StudioSelectionLauncher } from "../../../features/vehicle-create/studio-selection-launcher";
import { VehicleCreateLauncher } from "../../../features/vehicle-create/vehicle-create-launcher";
import { getCurrentSession } from "../../../server/auth/get-current-session";
import { getInventoryService } from "../../../server/inventory/inventory-runtime";
import { getPortfolioService } from "../../../server/portfolio/portfolio-runtime";

export const dynamic = "force-dynamic";

export interface InventoryPageProps {
  searchParams: Promise<InventorySearchParams>;
}

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const session = await getCurrentSession();
  if (!session) redirect(LOGIN_PATH);

  const parameters = await searchParams;
  const query = parseInventorySearchParams(parameters);
  const choosing = query.mode === "CREATE_STUDIO";
  const vehicle = EntityIdSchema.safeParse(parameters[INVENTORY_VEHICLE_QUERY_KEY]);
  const [page, selection] = await Promise.all([
    getInventoryService().list(session.userId, query),
    choosing && vehicle.success
      ? getPortfolioService().getStudioSelection(session.userId, vehicle.data, {
          mode: "CREATE_VARIANT",
          versionId: null,
        })
      : null,
  ]);
  const filtered = Boolean(query.query) || query.filter !== "ALL";

  return (
    <div className="inventory-page">
      <header className="app-page-header">
        <div>
          <p className="eyebrow">
            {choosing ? INVENTORY_CREATE_STUDIO_EYEBROW : INVENTORY_EYEBROW}
          </p>
          <h1>{choosing ? INVENTORY_CREATE_STUDIO_TITLE : INVENTORY_TITLE}</h1>
          <p>{choosing ? INVENTORY_CREATE_STUDIO_DESCRIPTION : INVENTORY_DESCRIPTION}</p>
        </div>
        {choosing ? (
          <ButtonLink href={INVENTORY_PATH} variant="secondary">
            {INVENTORY_CREATE_STUDIO_EXIT_LABEL}
          </ButtonLink>
        ) : (
          <VehicleCreateLauncher />
        )}
      </header>
      {choosing && vehicle.success && !selection ? (
        <p className="portfolio-notice portfolio-notice--error" role="alert">
          {PORTFOLIO_STUDIO_UNAVAILABLE_MESSAGE}
        </p>
      ) : null}
      <InventoryToolbar query={query} />
      {choosing ? null : <InventoryFilterBar counts={page.counts} query={query} />}
      {page.items.length > 0 ? (
        <InventoryGrid
          items={page.items}
          selectHref={
            choosing
              ? (vehicleId) => createInventoryHref(query, {}, vehicleId)
              : undefined
          }
          view={query.view}
        />
      ) : (
        <InventoryEmptyState choosing={choosing} filtered={filtered} />
      )}
      {page.nextCursor ? (
        <a
          className="sc-button sc-button--secondary inventory-page__next"
          href={createInventoryHref(query, { cursor: page.nextCursor })}
        >
          {INVENTORY_NEXT_PAGE_LABEL}
        </a>
      ) : null}
      {selection ? (
        <StudioSelectionLauncher
          cancelHref={createInventoryHref(query, {})}
          context={selection}
          successHref={INVENTORY_PATH}
        />
      ) : null}
    </div>
  );
}
