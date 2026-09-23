import { StatePanel } from "@studiocar/ui";

import {
  INVENTORY_CREATE_STUDIO_EMPTY_DESCRIPTION,
  INVENTORY_CREATE_STUDIO_EMPTY_TITLE,
  INVENTORY_EMPTY_DESCRIPTION,
  INVENTORY_EMPTY_TITLE,
  INVENTORY_NO_RESULTS_DESCRIPTION,
  INVENTORY_NO_RESULTS_TITLE,
} from "./inventory.constants";
import { VehicleCreateLauncher } from "../vehicle-create/vehicle-create-launcher";

export interface InventoryEmptyStateProps {
  /** Choosing a vehicle for a new studio version found none ready. */
  choosing?: boolean;
  filtered: boolean;
}

function emptyCopy(choosing: boolean, filtered: boolean) {
  if (filtered) {
    return {
      description: INVENTORY_NO_RESULTS_DESCRIPTION,
      title: INVENTORY_NO_RESULTS_TITLE,
    };
  }
  if (choosing) {
    return {
      description: INVENTORY_CREATE_STUDIO_EMPTY_DESCRIPTION,
      title: INVENTORY_CREATE_STUDIO_EMPTY_TITLE,
    };
  }
  return { description: INVENTORY_EMPTY_DESCRIPTION, title: INVENTORY_EMPTY_TITLE };
}

export function InventoryEmptyState({
  choosing = false,
  filtered,
}: InventoryEmptyStateProps) {
  const copy = emptyCopy(choosing, filtered);
  return (
    <StatePanel
      action={filtered || choosing ? undefined : <VehicleCreateLauncher />}
      description={copy.description}
      icon={<span aria-hidden="true">▦</span>}
      title={copy.title}
    />
  );
}
