import { randomUUID } from "node:crypto";
import {
  UpdateProfileSchema,
  type UpdateProfileResponse,
} from "@studiocar/contracts";

import { createApiErrorResponse } from "../auth/create-api-error-response";
import { isSameOriginRequest } from "../auth/is-same-origin-request";
import type { ActiveSession } from "../auth/session-service";
import {
  PROFILE_BAD_REQUEST_CODE,
  PROFILE_BAD_REQUEST_STATUS,
  PROFILE_FORBIDDEN_CODE,
  PROFILE_FORBIDDEN_MESSAGE,
  PROFILE_FORBIDDEN_STATUS,
  PROFILE_INVALID_REQUEST_MESSAGE,
  PROFILE_NOT_FOUND_CODE,
  PROFILE_NOT_FOUND_MESSAGE,
  PROFILE_NOT_FOUND_STATUS,
  PROFILE_UNAUTHENTICATED_CODE,
  PROFILE_UNAUTHENTICATED_MESSAGE,
  PROFILE_UNAUTHENTICATED_STATUS,
} from "./profile.constants";
import type { ProfileApplication } from "./profile.types";

export async function handleUpdateProfile(
  request: Request,
  session: ActiveSession | null,
  profiles: ProfileApplication,
  createRequestId: () => string = randomUUID,
): Promise<Response> {
  if (!isSameOriginRequest(request)) {
    return createApiErrorResponse({
      status: PROFILE_FORBIDDEN_STATUS,
      code: PROFILE_FORBIDDEN_CODE,
      message: PROFILE_FORBIDDEN_MESSAGE,
      requestId: createRequestId(),
    });
  }

  if (!session) {
    return createApiErrorResponse({
      status: PROFILE_UNAUTHENTICATED_STATUS,
      code: PROFILE_UNAUTHENTICATED_CODE,
      message: PROFILE_UNAUTHENTICATED_MESSAGE,
      requestId: createRequestId(),
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createApiErrorResponse({
      status: PROFILE_BAD_REQUEST_STATUS,
      code: PROFILE_BAD_REQUEST_CODE,
      message: PROFILE_INVALID_REQUEST_MESSAGE,
      requestId: createRequestId(),
    });
  }

  const parsed = UpdateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return createApiErrorResponse({
      status: PROFILE_BAD_REQUEST_STATUS,
      code: PROFILE_BAD_REQUEST_CODE,
      message: PROFILE_INVALID_REQUEST_MESSAGE,
      requestId: createRequestId(),
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
  }

  const user = await profiles.update(session.userId, parsed.data);
  if (!user) {
    return createApiErrorResponse({
      status: PROFILE_NOT_FOUND_STATUS,
      code: PROFILE_NOT_FOUND_CODE,
      message: PROFILE_NOT_FOUND_MESSAGE,
      requestId: createRequestId(),
    });
  }

  const response: UpdateProfileResponse = { user };
  return Response.json(response);
}
