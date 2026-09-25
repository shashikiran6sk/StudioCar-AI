import type { ExistingVehicleSelectionMode } from "@studiocar/contracts";

import {
  EXISTING_PHOTOS_TITLE,
  EXISTING_VEHICLE_SELECTION_COPY,
  EXISTING_VEHICLE_TOTAL_STEPS,
} from "./studio-selection.constants";
import {
  VEHICLE_CREATE_DESCRIPTION,
  VEHICLE_CREATE_EYEBROW,
  VEHICLE_CREATE_STEP_LABELS,
  VEHICLE_CREATE_TOTAL_STEPS,
} from "./vehicle-create.constants";
import { VehicleCreateStep } from "./vehicle-create-step";
import { vehicleCreateStepTitle } from "./vehicle-create-step-title";

export interface StudioSelectionHeading {
  description: string;
  eyebrow: string;
  photosNote: string | undefined;
  step: { current: number; labels?: readonly string[]; total: number };
  title: string;
}

/**
 * The dialog's heading for a step. A vehicle that already exists skips the
 * details step, so its stepper counts three steps instead of four.
 */
export function studioSelectionHeading(
  step: VehicleCreateStep,
  mode: ExistingVehicleSelectionMode | undefined,
): StudioSelectionHeading {
  if (!mode) {
    return {
      description: VEHICLE_CREATE_DESCRIPTION,
      eyebrow: VEHICLE_CREATE_EYEBROW,
      photosNote: undefined,
      step: { current: step, labels: VEHICLE_CREATE_STEP_LABELS, total: VEHICLE_CREATE_TOTAL_STEPS },
      title: vehicleCreateStepTitle(step),
    };
  }
  const copy = EXISTING_VEHICLE_SELECTION_COPY[mode];
  return {
    description: copy.description,
    eyebrow: copy.eyebrow,
    photosNote: copy.photosNote,
    step: {
      current: Math.max(1, step - VehicleCreateStep.Details),
      total: EXISTING_VEHICLE_TOTAL_STEPS,
    },
    title:
      step === VehicleCreateStep.Photos
        ? EXISTING_PHOTOS_TITLE
        : vehicleCreateStepTitle(step),
  };
}
