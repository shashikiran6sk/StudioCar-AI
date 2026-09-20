import { randomUUID } from "node:crypto";

import { createApiErrorResponse } from "../auth/create-api-error-response";
import { dispatchTokenIsValid } from "../internal/dispatch-token-is-valid";
import {
  STORAGE_CLEANUP_CACHE_CONTROL_HEADER,
  STORAGE_CLEANUP_FORBIDDEN_CODE,
  STORAGE_CLEANUP_FORBIDDEN_MESSAGE,
  STORAGE_CLEANUP_FORBIDDEN_STATUS,
  STORAGE_CLEANUP_PRIVATE_CACHE_CONTROL,
  STORAGE_CLEANUP_UNAVAILABLE_CODE,
  STORAGE_CLEANUP_UNAVAILABLE_MESSAGE,
  STORAGE_CLEANUP_UNAVAILABLE_STATUS,
} from "./storage-cleanup.constants";
import type { StorageCleanupApplication } from "./storage-cleanup.types";

export async function handleStorageCleanup(
  request: Request,
  expectedToken: string,
  cleanup: StorageCleanupApplication,
  createRequestId: () => string = randomUUID,
): Promise<Response> {
  if (!dispatchTokenIsValid(request, expectedToken)) {
    return createApiErrorResponse({
      status: STORAGE_CLEANUP_FORBIDDEN_STATUS,
      code: STORAGE_CLEANUP_FORBIDDEN_CODE,
      message: STORAGE_CLEANUP_FORBIDDEN_MESSAGE,
      requestId: createRequestId(),
    });
  }

  try {
    return Response.json(await cleanup.run(), {
      headers: {
        [STORAGE_CLEANUP_CACHE_CONTROL_HEADER]:
          STORAGE_CLEANUP_PRIVATE_CACHE_CONTROL,
      },
    });
  } catch {
    return createApiErrorResponse({
      status: STORAGE_CLEANUP_UNAVAILABLE_STATUS,
      code: STORAGE_CLEANUP_UNAVAILABLE_CODE,
      message: STORAGE_CLEANUP_UNAVAILABLE_MESSAGE,
      requestId: createRequestId(),
    });
  }
}
