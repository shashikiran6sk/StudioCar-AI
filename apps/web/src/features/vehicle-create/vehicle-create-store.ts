import { create } from "zustand";
import type {
  ProcessingOptions,
  StudioSelectionContext,
  StudioSelectionMode,
} from "@studiocar/contracts";

import { createExistingPhotoItem } from "./create-existing-photo-item";
import { releasePhotoPreview } from "./release-photo-preview";
import { toVehicleDetailsValues } from "./to-vehicle-details-values";

import {
  DEFAULT_PROCESSING_OPTIONS,
  EMPTY_VEHICLE_DETAILS,
} from "./vehicle-create.constants";
import { VehicleCreateStep } from "./vehicle-create-step";
import { NEW_UPLOAD_MODE } from "./studio-selection.constants";
import type {
  VehicleDetailsField,
  VehicleDetailsValues,
} from "./vehicle-details.types";
import type { PhotoUploadItem } from "./photo-upload.types";

interface VehicleCreateState {
  /** The optional batch label as typed; trimmed only when submitted. */
  batchLabel: string;
  details: VehicleDetailsValues;
  mode: StudioSelectionMode;
  options: ProcessingOptions;
  photos: PhotoUploadItem[];
  step: VehicleCreateStep;
  vehicleId: string | null;
  reset: () => void;
  /** Opens the dialog on an existing vehicle, from the server's context. */
  initialize: (context: StudioSelectionContext) => void;
  addPhotos: (photos: PhotoUploadItem[]) => void;
  movePhoto: (clientId: string, offset: -1 | 1) => void;
  removePhoto: (clientId: string) => void;
  /** Puts a newly chosen photo in a failed photo's place. */
  replacePhoto: (clientId: string, replacement: PhotoUploadItem) => void;
  togglePhotoSelected: (clientId: string) => void;
  setBatchLabel: (batchLabel: string) => void;
  setOptions: (options: ProcessingOptions) => void;
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
  batchLabel: "",
  details: EMPTY_VEHICLE_DETAILS,
  mode: NEW_UPLOAD_MODE,
  options: DEFAULT_PROCESSING_OPTIONS,
  photos: [],
  step: VehicleCreateStep.Details,
  vehicleId: null,
  reset: () =>
    set((state) => {
      state.photos.forEach(releasePhotoPreview);
      return {
        batchLabel: "",
        details: EMPTY_VEHICLE_DETAILS,
        mode: NEW_UPLOAD_MODE,
        options: DEFAULT_PROCESSING_OPTIONS,
        photos: [],
        step: VehicleCreateStep.Details,
        vehicleId: null,
      };
    }),
  initialize: (context) =>
    set((state) => {
      state.photos.forEach(releasePhotoPreview);
      return {
        // A label names one batch, so a new version never inherits one.
        batchLabel: "",
        details: toVehicleDetailsValues(context.vehicle),
        mode: context.mode,
        options: context.options,
        photos: context.images.map(createExistingPhotoItem),
        // The vehicle already exists, so the dialog starts at its photos.
        step: VehicleCreateStep.Photos,
        vehicleId: context.vehicle.id,
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
      if (removed) releasePhotoPreview(removed);
      return {
        photos: state.photos.filter((photo) => photo.clientId !== clientId),
      };
    }),
  replacePhoto: (clientId, replacement) =>
    set((state) => {
      const replaced = state.photos.find((photo) => photo.clientId === clientId);
      if (!replaced) return state;
      releasePhotoPreview(replaced);
      return {
        photos: state.photos.map((photo) =>
          photo.clientId === clientId ? replacement : photo,
        ),
      };
    }),
  togglePhotoSelected: (clientId) =>
    set((state) => ({
      photos: state.photos.map((photo) =>
        photo.clientId === clientId && !photo.replaceRequired
          ? { ...photo, selected: !photo.selected }
          : photo,
      ),
    })),
  setDetailsField: (field, value) =>
    set((state) => ({
      details: updateVehicleDetails(state.details, field, value),
    })),
  setBatchLabel: (batchLabel) => set({ batchLabel }),
  setDraft: (vehicleId) => set({ step: VehicleCreateStep.Photos, vehicleId }),
  setOptions: (options) => set({ options }),
  setStep: (step) => set({ step }),
  updatePhoto: (clientId, update) =>
    set((state) => ({
      photos: state.photos.map((photo) =>
        photo.clientId === clientId ? { ...photo, ...update } : photo,
      ),
    })),
}));
