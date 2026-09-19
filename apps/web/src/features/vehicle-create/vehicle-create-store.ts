import { create } from "zustand";

import {
  EMPTY_VEHICLE_DETAILS,
  VEHICLE_DETAILS_STEP,
  VEHICLE_PHOTOS_STEP,
} from "./vehicle-create.constants";
import type {
  VehicleDetailsField,
  VehicleDetailsValues,
} from "./vehicle-details.types";

interface VehicleCreateState {
  details: VehicleDetailsValues;
  step: number;
  vehicleId: string | null;
  reset: () => void;
  setDetailsField: (field: VehicleDetailsField, value: string) => void;
  setDraft: (vehicleId: string) => void;
}

function updateVehicleDetails(
  details: VehicleDetailsValues,
  field: VehicleDetailsField,
  value: string,
): VehicleDetailsValues {
  switch (field) {
    case "brand":
      return { ...details, brand: value };
    case "internalId":
      return { ...details, internalId: value };
    case "model":
      return { ...details, model: value };
    case "name":
      return { ...details, name: value };
    case "notes":
      return { ...details, notes: value };
    case "stockId":
      return { ...details, stockId: value };
    case "variant":
      return { ...details, variant: value };
    case "year":
      return { ...details, year: value };
  }
}

export const useVehicleCreateStore = create<VehicleCreateState>((set) => ({
  details: EMPTY_VEHICLE_DETAILS,
  step: VEHICLE_DETAILS_STEP,
  vehicleId: null,
  reset: () =>
    set({
      details: EMPTY_VEHICLE_DETAILS,
      step: VEHICLE_DETAILS_STEP,
      vehicleId: null,
    }),
  setDetailsField: (field, value) =>
    set((state) => ({
      details: updateVehicleDetails(state.details, field, value),
    })),
  setDraft: (vehicleId) => set({ step: VEHICLE_PHOTOS_STEP, vehicleId }),
}));
