import {
  ApiErrorSchema,
  CreateVehicleResponseSchema,
  type CreateVehicle,
  type CreateVehicleResponse,
} from "@studiocar/contracts";

import {
  VEHICLE_CREATE_CONTENT_TYPE_HEADER,
  VEHICLE_CREATE_GENERIC_ERROR,
  VEHICLE_CREATE_IDEMPOTENCY_HEADER,
  VEHICLE_CREATE_JSON_CONTENT_TYPE,
  VEHICLE_CREATE_METHOD,
  VEHICLE_CREATE_ROUTE,
} from "./vehicle-create.constants";

export async function requestCreateVehicleDraft(
  command: CreateVehicle,
  idempotencyKey: string,
  fetcher: typeof fetch = fetch,
): Promise<CreateVehicleResponse> {
  const response = await fetcher(VEHICLE_CREATE_ROUTE, {
    body: JSON.stringify(command),
    headers: {
      [VEHICLE_CREATE_CONTENT_TYPE_HEADER]: VEHICLE_CREATE_JSON_CONTENT_TYPE,
      [VEHICLE_CREATE_IDEMPOTENCY_HEADER]: idempotencyKey,
    },
    method: VEHICLE_CREATE_METHOD,
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = ApiErrorSchema.safeParse(body);
    throw new Error(
      error.success ? error.data.error.message : VEHICLE_CREATE_GENERIC_ERROR,
    );
  }
  return CreateVehicleResponseSchema.parse(body);
}
