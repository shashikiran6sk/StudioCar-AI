import type { ProcessingOptions } from "@studiocar/contracts";

import type { VehicleDetailsValues } from "./vehicle-details.types";
import {
  DEFAULT_BACKGROUND_TREATMENT,
  DEFAULT_FLOOR_STYLE,
  MAINTAIN_COMPOSITION_CROP,
} from "./processing-option.constants";

export const VEHICLE_DETAILS_CONTINUE_LABEL = "Continue to photos";
export const VEHICLE_DETAILS_PENDING_LABEL = "Saving…";
export const VEHICLE_DETAILS_GENERIC_ERROR =
  "Check the vehicle details and try again.";
export const VEHICLE_DETAILS_STEP_LABEL = "Step 1 of 4";
export const VEHICLE_DETAILS_TITLE = "Vehicle details";
export const VEHICLE_CREATE_EYEBROW = "New vehicle batch";
export const VEHICLE_CREATE_DESCRIPTION =
  "Create a vehicle, upload its photos, and choose a studio treatment.";
export const VEHICLE_CREATE_TOTAL_STEPS = 4;
export const VEHICLE_NOTES_MAX_LENGTH = 2_000;
export const PHOTO_UPLOAD_TITLE = "Upload photos";
export const PHOTO_UPLOAD_DROP_LABEL = "Drop vehicle photos here";
export const PHOTO_UPLOAD_SELECT_LABEL = "Select photos";
export const PHOTO_UPLOAD_RETRY_LABEL = "Retry";
export const PHOTO_UPLOAD_REMOVE_LABEL = "Remove";
export const PHOTO_UPLOAD_MOVE_UP_LABEL = "Move up";
export const PHOTO_UPLOAD_MOVE_DOWN_LABEL = "Move down";
export const PHOTO_UPLOAD_REORDER_LABEL = "Reorder";
export const PHOTO_UPLOAD_FORMATS_LABEL = "or select JPG, JPEG, PNG, or WEBP";
/**
 * Pieces of `Free plan · Up to 5 images per batch. Upgrade for 20-image
 * batches.`, which is built from the account's plan rather than stored.
 */
export const PHOTO_UPLOAD_LIMIT_PLAN_SUFFIX = "plan";
export const PHOTO_UPLOAD_LIMIT_SEPARATOR = " · ";
export const PHOTO_UPLOAD_LIMIT_PREFIX = "Up to";
export const PHOTO_UPLOAD_LIMIT_IMAGE_SINGULAR = "image";
export const PHOTO_UPLOAD_LIMIT_IMAGE_PLURAL = "images";
export const PHOTO_UPLOAD_LIMIT_PER_BATCH = "per batch.";
export const PHOTO_UPLOAD_LIMIT_UPGRADE_PREFIX = "Upgrade for";
export const PHOTO_UPLOAD_LIMIT_UPGRADE_SUFFIX = "-image batches.";
export const PHOTO_UPLOAD_BACK_LABEL = "← Back";
export const PHOTO_UPLOAD_CONTINUE_LABEL = "Continue to customize →";
export const PHOTO_UPLOAD_EMPTY_ERROR = "Add at least one vehicle photo.";
export const PHOTO_UPLOAD_INCOMPLETE_ERROR =
  "Wait for active uploads or retry failed photos before continuing.";
export const PHOTO_UPLOAD_GENERIC_ERROR =
  "Upload failed. Check your connection and retry this photo.";
export const PHOTO_UPLOAD_WAITING_STATUS_LABEL = "Waiting";
export const PHOTO_UPLOAD_PREPARING_STATUS_LABEL = "Preparing";
export const PHOTO_UPLOAD_UPLOADING_STATUS_LABEL = "Uploading";
export const PHOTO_UPLOAD_FINALIZING_STATUS_LABEL = "Finalizing";
export const PHOTO_UPLOAD_UPLOADED_STATUS_LABEL = "Uploaded";
export const PHOTO_UPLOAD_FAILED_STATUS_LABEL = "Upload failed";
export const PHOTO_UPLOAD_UNSUPPORTED_ERROR =
  "Only JPG, JPEG, PNG, and WEBP images are supported.";
export const PHOTO_UPLOAD_SIZE_ERROR = "Each image must be 25 MB or smaller.";
export const PHOTO_UPLOAD_LIMIT_ERROR = "This batch has reached its image limit.";
export const PHOTO_UPLOAD_PRESIGN_ROUTE = "/api/uploads/presign";
export const PHOTO_UPLOAD_COMMIT_ROUTE_PREFIX = "/api/uploads";
export const PHOTO_UPLOAD_COMMIT_ROUTE_SUFFIX = "/commit";
export const PHOTO_UPLOAD_IDEMPOTENCY_HEADER = "idempotency-key";
export const PHOTO_UPLOAD_CONTENT_TYPE_HEADER = "content-type";
export const PHOTO_UPLOAD_ETAG_HEADER = "etag";
export const PHOTO_UPLOAD_ACCEPT = "image/jpeg,image/png,image/webp";
export const PHOTO_UPLOAD_MIN_PROGRESS = 0;
export const PHOTO_UPLOAD_MAX_PROGRESS = 100;
export const CUSTOMIZE_TREATMENT_TITLE = "Customize treatment";
export const CUSTOMIZE_BACK_LABEL = "← Back";
export const CUSTOMIZE_CONTINUE_LABEL = "Review batch →";
export const CUSTOMIZE_BACKGROUND_HEADING = "Choose a studio background";
export const CUSTOMIZE_FLOOR_HEADING = "Choose a floor";
export const CUSTOMIZE_PRESERVATION_NOTE =
  "Preview updates preserve the original photo. You can compare and re-process later.";
export const PLATE_PRIVACY_LABEL = "Hide Number Plate";
export const PLATE_PRIVACY_DESCRIPTION = "Automatically mask visible plates";
export const ENHANCEMENT_LABEL = "Image Enhancement";
export const ENHANCEMENT_DESCRIPTION = "Refine lighting, clarity, and colour";
export const STUDIO_BACKGROUND_LABEL = "Studio Background";
export const STUDIO_BACKGROUND_DESCRIPTION =
  "Apply a consistent premium setting";
export const MAINTAIN_COMPOSITION_LABEL = "Maintain Composition";
export const MAINTAIN_COMPOSITION_DESCRIPTION =
  "Preserve crop and vehicle position";
export const CUSTOM_BACKGROUND_UNAVAILABLE_LABEL = "Custom background unavailable";
export const REVIEW_PROCESS_TITLE = "Review & process";
export const REVIEW_BACK_LABEL = "← Back";
export const REVIEW_PROCESS_LABEL = "Process Photos";
export const REVIEW_PROCESS_PENDING_LABEL = "Starting…";
export const REVIEW_PROCESS_ERROR =
  "Processing could not be started. Your draft and originals are preserved.";
export const REVIEW_IMAGE_LABEL = "Images";
export const REVIEW_PLATE_PRIVACY_LABEL = "Plate privacy";
export const REVIEW_BACKGROUND_LABEL = "Background";
export const REVIEW_FLOOR_LABEL = "Floor";
export const REVIEW_ENHANCEMENT_LABEL = "Enhancement";
export const REVIEW_ESTIMATED_USAGE_LABEL = "Estimated usage";
export const REVIEW_ENABLED_LABEL = "Enabled";
export const REVIEW_DISABLED_LABEL = "Disabled";
export const REVIEW_CREDIT_LABEL = "image credits";
export const REVIEW_PHOTO_SINGULAR_LABEL = "photo";
export const REVIEW_PHOTO_PLURAL_LABEL = "photos";
export const REVIEW_PRESERVATION_NOTE =
  "Your originals are always preserved. Processing continues if you leave this screen.";
export const VEHICLE_CREATE_ROUTE = "/api/vehicles";
export const VEHICLE_CREATE_METHOD = "POST";
export const VEHICLE_UPDATE_METHOD = "PATCH";
export const VEHICLE_CREATE_CONTENT_TYPE_HEADER = "content-type";
export const VEHICLE_CREATE_JSON_CONTENT_TYPE = "application/json";
export const VEHICLE_CREATE_IDEMPOTENCY_HEADER = "idempotency-key";
export const VEHICLE_CREATE_GENERIC_ERROR =
  "The vehicle draft could not be saved. Try again.";
export const PROCESSING_BATCH_ROUTE = "/api/jobs";
export const PROCESSING_BATCH_METHOD = "POST";
export const PROCESSING_BATCH_IDEMPOTENCY_HEADER = "idempotency-key";
export const PROCESSING_BATCH_GENERIC_ERROR =
  "Processing could not be started. Your draft and originals are preserved.";
export const VEHICLE_CREATE_TRIGGER_LABEL = "+ Upload Vehicle";
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
export const DEFAULT_PROCESSING_OPTIONS: ProcessingOptions = {
  background: DEFAULT_BACKGROUND_TREATMENT,
  floor: DEFAULT_FLOOR_STYLE,
  crop: MAINTAIN_COMPOSITION_CROP,
  enhancement: true,
  outputFormat: "JPEG",
  paddingPercent: 8,
  platePrivacy: true,
  quality: 90,
  shadow: "NATURAL",
};
