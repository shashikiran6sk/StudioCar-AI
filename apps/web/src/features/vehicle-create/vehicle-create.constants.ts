import type { VehicleDetailsValues } from "./vehicle-details.types";

export const VEHICLE_DETAILS_CONTINUE_LABEL = "Continue to photos";
export const VEHICLE_DETAILS_PENDING_LABEL = "Saving…";
export const VEHICLE_DETAILS_GENERIC_ERROR =
  "Check the vehicle details and try again.";
export const VEHICLE_DETAILS_STEP_LABEL = "Step 1 of 4";
export const VEHICLE_DETAILS_STEP = 1;
export const VEHICLE_PHOTOS_STEP = 2;
export const VEHICLE_NOTES_MAX_LENGTH = 2_000;
export const VEHICLE_DETAILS_LABELS = {
  name: "Vehicle name",
  brand: "Brand",
  model: "Model",
  variant: "Variant",
  year: "Year",
  stockId: "Stock ID",
  internalId: "Internal ID",
  notes: "Notes",
} satisfies Record<keyof VehicleDetailsValues, string>;
export const VEHICLE_DETAILS_PLACEHOLDERS = {
  name: "e.g. 2025 Porsche 911 Carrera",
  brand: "e.g. Porsche",
  model: "e.g. 911",
  variant: "e.g. Carrera",
  year: "e.g. 2025",
  stockId: "e.g. SC-1042",
  internalId: "e.g. INV-204",
  notes: "Add any notes about this vehicle",
} satisfies Record<keyof VehicleDetailsValues, string>;
export const EMPTY_VEHICLE_DETAILS: VehicleDetailsValues = {
  brand: "",
  internalId: "",
  model: "",
  name: "",
  notes: "",
  stockId: "",
  variant: "",
  year: "",
};
