import type { StudioSelectionVehicle } from "@studiocar/contracts";

import type { VehicleDetailsValues } from "./vehicle-details.types";

/** An existing vehicle's identity, in the shape the review step reads. */
export function toVehicleDetailsValues(
  vehicle: StudioSelectionVehicle,
): VehicleDetailsValues {
  return {
    brand: vehicle.brand ?? "",
    internalId: "",
    model: vehicle.model ?? "",
    name: vehicle.name,
    notes: "",
    stockId: vehicle.stockId ?? "",
    variant: vehicle.variant ?? "",
    year: vehicle.year === null ? "" : String(vehicle.year),
  };
}
