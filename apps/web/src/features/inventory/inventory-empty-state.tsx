import { StatePanel } from "@studiocar/ui";

import {
  INVENTORY_EMPTY_DESCRIPTION,
  INVENTORY_EMPTY_TITLE,
  INVENTORY_NO_RESULTS_DESCRIPTION,
  INVENTORY_NO_RESULTS_TITLE,
} from "./inventory.constants";
import { VehicleCreateLauncher } from "../vehicle-create/vehicle-create-launcher";

export interface InventoryEmptyStateProps {
  filtered: boolean;
}

export function InventoryEmptyState({ filtered }: InventoryEmptyStateProps) {
  return (
    <StatePanel
      action={filtered ? undefined : <VehicleCreateLauncher />}
      description={
        filtered ? INVENTORY_NO_RESULTS_DESCRIPTION : INVENTORY_EMPTY_DESCRIPTION
      }
      icon={<span aria-hidden="true">▦</span>}
      title={filtered ? INVENTORY_NO_RESULTS_TITLE : INVENTORY_EMPTY_TITLE}
    />
  );
}
