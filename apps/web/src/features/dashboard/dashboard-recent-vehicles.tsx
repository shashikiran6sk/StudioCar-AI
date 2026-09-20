import type { InventoryItem } from "@studiocar/contracts";
import { ButtonLink, StatePanel } from "@studiocar/ui";

import {
  DASHBOARD_RECENT_EMPTY_DESCRIPTION,
  DASHBOARD_RECENT_EMPTY_TITLE,
  DASHBOARD_RECENT_TITLE,
  DASHBOARD_VIEW_ALL_LABEL,
} from "./dashboard.constants";
import { INVENTORY_PATH } from "../../app/app-routes";
import { InventoryCard } from "../inventory/inventory-card";
import { VehicleCreateLauncher } from "../vehicle-create/vehicle-create-launcher";

export interface DashboardRecentVehiclesProps {
  vehicles: InventoryItem[];
}

export function DashboardRecentVehicles({
  vehicles,
}: DashboardRecentVehiclesProps) {
  return (
    <section className="dashboard-section dashboard-recent">
      <div className="dashboard-section__heading">
        <h2>{DASHBOARD_RECENT_TITLE}</h2>
        {vehicles.length > 0 ? (
          <ButtonLink href={INVENTORY_PATH} size="small" variant="ghost">
            {DASHBOARD_VIEW_ALL_LABEL} →
          </ButtonLink>
        ) : null}
      </div>
      {vehicles.length > 0 ? (
        <div className="dashboard-recent__grid">
          {vehicles.map((vehicle) => (
            <InventoryCard item={vehicle} key={vehicle.id} />
          ))}
        </div>
      ) : (
        <StatePanel
          action={<VehicleCreateLauncher />}
          description={DASHBOARD_RECENT_EMPTY_DESCRIPTION}
          icon={<span aria-hidden="true">▦</span>}
          title={DASHBOARD_RECENT_EMPTY_TITLE}
        />
      )}
    </section>
  );
}
