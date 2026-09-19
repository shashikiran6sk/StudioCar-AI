import type { VehicleDetailsValues } from "./vehicle-details.types";

export const VEHICLE_DETAILS_CONTINUE_LABEL = "Continue to photos";
export const VEHICLE_DETAILS_PENDING_LABEL = "Saving…";
export const VEHICLE_DETAILS_GENERIC_ERROR =
  "Check the vehicle details and try again.";
export const VEHICLE_DETAILS_STEP_LABEL = "Step 1 of 4";
export const VEHICLE_DETAILS_STEP = 1;
export const VEHICLE_PHOTOS_STEP = 2;
export const VEHICLE_CUSTOMIZE_STEP = 3;
export const VEHICLE_NOTES_MAX_LENGTH = 2_000;
export const FREE_PLAN_PHOTO_LIMIT = 3;
export const PHOTO_UPLOAD_TITLE = "Upload photos";
export const PHOTO_UPLOAD_DROP_LABEL = "Drop vehicle photos here";
export const PHOTO_UPLOAD_SELECT_LABEL = "Select photos";
export const PHOTO_UPLOAD_RETRY_LABEL = "Retry";
export const PHOTO_UPLOAD_REMOVE_LABEL = "Remove";
export const PHOTO_UPLOAD_MOVE_UP_LABEL = "Move up";
export const PHOTO_UPLOAD_MOVE_DOWN_LABEL = "Move down";
export const PHOTO_UPLOAD_REORDER_LABEL = "Reorder";
export const PHOTO_UPLOAD_FORMATS_LABEL = "or select JPG, JPEG, PNG, or WEBP";
export const PHOTO_UPLOAD_LIMIT_LABEL =
  "Free plan · Up to 3 images per batch. Upgrade for 20-image batches.";
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
