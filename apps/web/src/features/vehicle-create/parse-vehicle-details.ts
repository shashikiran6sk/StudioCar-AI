import { CreateVehicleSchema, type CreateVehicle } from "@studiocar/contracts";

import type { VehicleDetailsValues } from "./vehicle-details.types";

export type ParseVehicleDetailsResult =
  | { success: true; command: CreateVehicle }
  | { success: false; fieldErrors: Record<string, string[]> };

function optionalValue(value: string): string | undefined {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export function parseVehicleDetails(
  values: VehicleDetailsValues,
): ParseVehicleDetailsResult {
  const result = CreateVehicleSchema.safeParse({
    name: values.name,
    brand: optionalValue(values.brand),
    model: optionalValue(values.model),
    variant: optionalValue(values.variant),
    year: optionalValue(values.year),
    stockId: optionalValue(values.stockId),
    notes: optionalValue(values.notes),
  });
  if (result.success) return { success: true, command: result.data };
  return { success: false, fieldErrors: result.error.flatten().fieldErrors };
}
