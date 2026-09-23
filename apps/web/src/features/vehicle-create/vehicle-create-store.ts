import { create } from "zustand";
import type {
  ProcessingSettings,
  StudioBackgroundId,
  StudioFloorId,
  StudioTreatment,
} from "@studiocar/contracts";

import { selectStudioBackground } from "../studio-treatment/select-studio-background";
import { selectStudioFloor } from "../studio-treatment/select-studio-floor";
import {
  DEFAULT_PROCESSING_SETTINGS,
  EMPTY_VEHICLE_DETAILS,
} from "./vehicle-create.constants";
import { VehicleCreateStep } from "./vehicle-create-step";
import type {
  VehicleDetailsField,
  VehicleDetailsValues,
} from "./vehicle-details.types";
import type { PhotoUploadItem } from "./photo-upload.types";

interface VehicleCreateState {
  details: VehicleDetailsValues;
  settings: ProcessingSettings;
  /** Off keeps each photo's own background. */
  studioBackgroundEnabled: boolean;
  /** The chosen background and floor; `null` until a background is picked. */
  studio: StudioTreatment | null;
  photos: PhotoUploadItem[];
  step: VehicleCreateStep;
  vehicleId: string | null;
  reset: () => void;
  addPhotos: (photos: PhotoUploadItem[]) => void;
  movePhoto: (clientId: string, offset: -1 | 1) => void;
  removePhoto: (clientId: string) => void;
  setSettings: (settings: ProcessingSettings) => void;
  setStudioBackgroundEnabled: (enabled: boolean) => void;
  selectBackground: (backgroundId: StudioBackgroundId) => void;
  selectFloor: (floorId: StudioFloorId) => void;
  setStep: (step: VehicleCreateStep) => void;
  setDetailsField: (field: VehicleDetailsField, value: string) => void;
  setDraft: (vehicleId: string) => void;
  updatePhoto: (
    clientId: string,
    update: Partial<Omit<PhotoUploadItem, "clientId" | "file" | "previewUrl">>,
  ) => void;
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
  settings: DEFAULT_PROCESSING_SETTINGS,
  studioBackgroundEnabled: true,
  studio: null,
  photos: [],
  step: VehicleCreateStep.Details,
  vehicleId: null,
  reset: () =>
    set((state) => {
      state.photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
      return {
        details: EMPTY_VEHICLE_DETAILS,
        settings: DEFAULT_PROCESSING_SETTINGS,
        studioBackgroundEnabled: true,
        studio: null,
        photos: [],
        step: VehicleCreateStep.Details,
        vehicleId: null,
      };
    }),
  addPhotos: (photos) =>
    set((state) => ({ photos: [...state.photos, ...photos] })),
  movePhoto: (clientId, offset) =>
    set((state) => {
      const currentIndex = state.photos.findIndex(
        (photo) => photo.clientId === clientId,
      );
      const nextIndex = currentIndex + offset;
      if (
        currentIndex < 0 ||
        nextIndex < 0 ||
        nextIndex >= state.photos.length
      ) {
        return state;
      }
      const photos = [...state.photos];
      const current = photos[currentIndex];
      const next = photos[nextIndex];
      if (!current || !next) return state;
      photos[currentIndex] = next;
      photos[nextIndex] = current;
      return { photos };
    }),
  removePhoto: (clientId) =>
    set((state) => {
      const removed = state.photos.find((photo) => photo.clientId === clientId);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return {
        photos: state.photos.filter((photo) => photo.clientId !== clientId),
      };
    }),
  setDetailsField: (field, value) =>
    set((state) => ({
      details: updateVehicleDetails(state.details, field, value),
    })),
  setDraft: (vehicleId) => set({ step: VehicleCreateStep.Photos, vehicleId }),
  setSettings: (settings) => set({ settings }),
  setStudioBackgroundEnabled: (studioBackgroundEnabled) =>
    set({ studioBackgroundEnabled }),
  selectBackground: (backgroundId) =>
    set((state) => ({
      studio: selectStudioBackground(state.studio, backgroundId),
    })),
  selectFloor: (floorId) =>
    set((state) =>
      state.studio
        ? { studio: selectStudioFloor(state.studio, floorId) }
        : state,
    ),
  setStep: (step) => set({ step }),
  updatePhoto: (clientId, update) =>
    set((state) => ({
      photos: state.photos.map((photo) =>
        photo.clientId === clientId ? { ...photo, ...update } : photo,
      ),
    })),
}));
