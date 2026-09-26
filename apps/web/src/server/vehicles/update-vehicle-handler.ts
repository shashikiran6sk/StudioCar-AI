import {
  ApplicationErrorCode,
  reportUnexpectedError,
} from "@studiocar/observability";
import { randomUUID } from "node:crypto";
import { UpdateVehicleSchema, VehiclePathSchema } from "@studiocar/contracts";

import { createApiErrorResponse } from "../auth/create-api-error-response";
import { isSameOriginRequest } from "../auth/is-same-origin-request";
import type { ActiveSession } from "../auth/session-service";
import {
  VEHICLE_BAD_REQUEST_CODE,
  VEHICLE_BAD_REQUEST_STATUS,
  VEHICLE_CACHE_CONTROL_HEADER,
  VEHICLE_CONFLICT_CODE,
  VEHICLE_CONFLICT_STATUS,
  VEHICLE_FORBIDDEN_CODE,
  VEHICLE_FORBIDDEN_MESSAGE,
  VEHICLE_FORBIDDEN_STATUS,
  VEHICLE_INVALID_REQUEST_MESSAGE,
  VEHICLE_NOT_FOUND_CODE,
  VEHICLE_NOT_FOUND_MESSAGE,
  VEHICLE_NOT_FOUND_STATUS,
  VEHICLE_PRIVATE_CACHE_CONTROL,
  VEHICLE_REFERENCE_CONFLICT_MESSAGE,
  VEHICLE_UNAUTHENTICATED_CODE,
  VEHICLE_UNAUTHENTICATED_MESSAGE,
  VEHICLE_UNAUTHENTICATED_STATUS,
  VEHICLE_UNAVAILABLE_CODE,
  VEHICLE_UNAVAILABLE_MESSAGE,
  VEHICLE_UNAVAILABLE_STATUS,
} from "./vehicle.constants";
import type { VehicleApplication } from "./vehicle.types";

export async function handleUpdateVehicle(
  request: Request,
  path: unknown,
  session: ActiveSession | null,
  vehicles: VehicleApplication,
  createRequestId: () => string = randomUUID,
): Promise<Response> {
  if (!isSameOriginRequest(request)) {
    return createApiErrorResponse({
      status: VEHICLE_FORBIDDEN_STATUS,
      code: VEHICLE_FORBIDDEN_CODE,
      message: VEHICLE_FORBIDDEN_MESSAGE,
      requestId: createRequestId(),
    });
  }
  if (!session) {
    return createApiErrorResponse({
      status: VEHICLE_UNAUTHENTICATED_STATUS,
      code: VEHICLE_UNAUTHENTICATED_CODE,
      message: VEHICLE_UNAUTHENTICATED_MESSAGE,
      requestId: createRequestId(),
    });
  }

  const parsedPath = VehiclePathSchema.safeParse(path);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const command = UpdateVehicleSchema.safeParse(body);
  if (!parsedPath.success || !command.success) {
    return createApiErrorResponse({
      status: VEHICLE_BAD_REQUEST_STATUS,
      code: VEHICLE_BAD_REQUEST_CODE,
      message: VEHICLE_INVALID_REQUEST_MESSAGE,
      ...(command.success
        ? {}
        : { fieldErrors: command.error.flatten().fieldErrors }),
      requestId: createRequestId(),
    });
  }

  try {
    const result = await vehicles.update(
      session.userId,
      parsedPath.data.vehicleId,
      command.data,
    );
    if (result.ok) {
      return Response.json(result.response, {
        headers: {
          [VEHICLE_CACHE_CONTROL_HEADER]: VEHICLE_PRIVATE_CACHE_CONTROL,
        },
      });
    }
    if (result.reason === "NOT_FOUND") {
      return createApiErrorResponse({
        status: VEHICLE_NOT_FOUND_STATUS,
        code: VEHICLE_NOT_FOUND_CODE,
        message: VEHICLE_NOT_FOUND_MESSAGE,
        requestId: createRequestId(),
      });
    }
    return createApiErrorResponse({
      status: VEHICLE_CONFLICT_STATUS,
      code: VEHICLE_CONFLICT_CODE,
      message: VEHICLE_REFERENCE_CONFLICT_MESSAGE,
      requestId: createRequestId(),
    });
  } catch (error) {
    reportUnexpectedError(error, ApplicationErrorCode.INTERNAL_ERROR);
    return createApiErrorResponse({
      status: VEHICLE_UNAVAILABLE_STATUS,
      code: VEHICLE_UNAVAILABLE_CODE,
      message: VEHICLE_UNAVAILABLE_MESSAGE,
      requestId: createRequestId(),
    });
  }
}
