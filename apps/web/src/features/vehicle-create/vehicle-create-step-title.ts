import { VehicleCreateStep } from "./vehicle-create-step";
import {
  CUSTOMIZE_TREATMENT_TITLE,
  PHOTO_UPLOAD_TITLE,
  REVIEW_PROCESS_TITLE,
  VEHICLE_DETAILS_TITLE,
} from "./vehicle-create.constants";

export function vehicleCreateStepTitle(step: VehicleCreateStep): string {
  switch (step) {
    case VehicleCreateStep.Details:
      return VEHICLE_DETAILS_TITLE;
    case VehicleCreateStep.Photos:
      return PHOTO_UPLOAD_TITLE;
    case VehicleCreateStep.Customize:
      return CUSTOMIZE_TREATMENT_TITLE;
    case VehicleCreateStep.Review:
      return REVIEW_PROCESS_TITLE;
  }
}
