import {
  ApiErrorSchema,
  UpdateVehicleResponseSchema,
  type UpdateVehicle,
  type UpdateVehicleResponse,
} from "@studiocar/contracts";

import {
  VEHICLE_CREATE_CONTENT_TYPE_HEADER,
  VEHICLE_CREATE_GENERIC_ERROR,
  VEHICLE_CREATE_JSON_CONTENT_TYPE,
  VEHICLE_CREATE_ROUTE,
  VEHICLE_UPDATE_METHOD,
} from "./vehicle-create.constants";

export async function requestUpdateVehicleDraft(
  vehicleId: string,
  command: UpdateVehicle,
  fetcher: typeof fetch = fetch,
): Promise<UpdateVehicleResponse> {
  const response = await fetcher(`${VEHICLE_CREATE_ROUTE}/${vehicleId}`, {
    body: JSON.stringify(command),
    headers: {
      [VEHICLE_CREATE_CONTENT_TYPE_HEADER]: VEHICLE_CREATE_JSON_CONTENT_TYPE,
    },
    method: VEHICLE_UPDATE_METHOD,
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = ApiErrorSchema.safeParse(body);
    throw new Error(
      error.success ? error.data.error.message : VEHICLE_CREATE_GENERIC_ERROR,
    );
  }
  return UpdateVehicleResponseSchema.parse(body);
}
