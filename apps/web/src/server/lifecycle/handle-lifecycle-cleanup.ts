import {
  ApplicationErrorCode,
  reportUnexpectedError,
} from "@studiocar/observability";
import { randomUUID } from "node:crypto";

import { createApiErrorResponse } from "../auth/create-api-error-response";
import { dispatchTokenIsValid } from "../internal/dispatch-token-is-valid";
import {
  LIFECYCLE_CACHE_CONTROL_HEADER,
  LIFECYCLE_FORBIDDEN_CODE,
  LIFECYCLE_FORBIDDEN_MESSAGE,
  LIFECYCLE_FORBIDDEN_STATUS,
  LIFECYCLE_PRIVATE_CACHE_CONTROL,
  LIFECYCLE_UNAVAILABLE_CODE,
  LIFECYCLE_UNAVAILABLE_MESSAGE,
  LIFECYCLE_UNAVAILABLE_STATUS,
} from "./lifecycle-cleanup.constants";
import type { LifecycleCleanupApplication } from "./lifecycle-cleanup.types";

export async function handleLifecycleCleanup(
  request: Request,
  expectedToken: string,
  cleanup: LifecycleCleanupApplication,
  createRequestId: () => string = randomUUID,
): Promise<Response> {
  if (!dispatchTokenIsValid(request, expectedToken)) {
    return createApiErrorResponse({
      status: LIFECYCLE_FORBIDDEN_STATUS,
      code: LIFECYCLE_FORBIDDEN_CODE,
      message: LIFECYCLE_FORBIDDEN_MESSAGE,
      requestId: createRequestId(),
    });
  }

  try {
    return Response.json(await cleanup.run(), {
      headers: {
        [LIFECYCLE_CACHE_CONTROL_HEADER]: LIFECYCLE_PRIVATE_CACHE_CONTROL,
      },
    });
  } catch (error) {
    reportUnexpectedError(error, ApplicationErrorCode.INTERNAL_ERROR);
    return createApiErrorResponse({
      status: LIFECYCLE_UNAVAILABLE_STATUS,
      code: LIFECYCLE_UNAVAILABLE_CODE,
      message: LIFECYCLE_UNAVAILABLE_MESSAGE,
      requestId: createRequestId(),
    });
  }
}
