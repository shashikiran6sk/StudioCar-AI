export const VEHICLE_IDEMPOTENCY_HEADER = "idempotency-key";
export const VEHICLE_CACHE_CONTROL_HEADER = "cache-control";
export const VEHICLE_PRIVATE_CACHE_CONTROL = "private, no-store";

export const VEHICLE_CREATED_STATUS = 201;
export const VEHICLE_BAD_REQUEST_STATUS = 400;
export const VEHICLE_UNAUTHENTICATED_STATUS = 401;
export const VEHICLE_FORBIDDEN_STATUS = 403;
export const VEHICLE_NOT_FOUND_STATUS = 404;
export const VEHICLE_CONFLICT_STATUS = 409;
export const VEHICLE_UNAVAILABLE_STATUS = 503;

export const VEHICLE_BAD_REQUEST_CODE = "BAD_REQUEST";
export const VEHICLE_UNAUTHENTICATED_CODE = "UNAUTHENTICATED";
export const VEHICLE_FORBIDDEN_CODE = "FORBIDDEN";
export const VEHICLE_NOT_FOUND_CODE = "NOT_FOUND";
export const VEHICLE_CONFLICT_CODE = "CONFLICT";
export const VEHICLE_UNAVAILABLE_CODE = "SERVICE_UNAVAILABLE";

export const VEHICLE_INVALID_REQUEST_MESSAGE = "Enter valid vehicle details.";
export const VEHICLE_INVALID_IDEMPOTENCY_MESSAGE =
  "Provide a valid idempotency key.";
export const VEHICLE_UNAUTHENTICATED_MESSAGE =
  "Sign in to manage your vehicles.";
export const VEHICLE_FORBIDDEN_MESSAGE = "The request origin is not allowed.";
export const VEHICLE_NOT_FOUND_MESSAGE =
  "The vehicle draft could not be found.";
export const VEHICLE_IDEMPOTENCY_CONFLICT_MESSAGE =
  "That request key was already used for different vehicle details.";
export const VEHICLE_REFERENCE_CONFLICT_MESSAGE =
  "The stock ID or internal ID is already assigned to another vehicle.";
export const VEHICLE_UNAVAILABLE_MESSAGE =
  "Vehicle details are temporarily unavailable. Try again.";
