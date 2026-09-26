import {
  ApplicationErrorCode,
  reportUnexpectedError,
} from "@studiocar/observability";
import { randomUUID } from "node:crypto";
import { UploadAssetPathSchema } from "@studiocar/contracts";

import { createApiErrorResponse } from "../auth/create-api-error-response";
import { isSameOriginRequest } from "../auth/is-same-origin-request";
import type { ActiveSession } from "../auth/session-service";
import {
  UPLOAD_ASSET_NOT_FOUND_MESSAGE,
  UPLOAD_BAD_REQUEST_CODE,
  UPLOAD_BAD_REQUEST_STATUS,
  UPLOAD_CONFLICT_CODE,
  UPLOAD_CONFLICT_STATUS,
  UPLOAD_FORBIDDEN_CODE,
  UPLOAD_FORBIDDEN_MESSAGE,
  UPLOAD_FORBIDDEN_STATUS,
  UPLOAD_INVALID_REQUEST_MESSAGE,
  UPLOAD_NOT_FOUND_CODE,
  UPLOAD_NOT_FOUND_STATUS,
  UPLOAD_REMOVE_CONFLICT_MESSAGE,
  UPLOAD_REMOVE_UNAUTHENTICATED_MESSAGE,
  UPLOAD_REMOVE_UNAVAILABLE_MESSAGE,
  UPLOAD_UNAUTHENTICATED_CODE,
  UPLOAD_UNAUTHENTICATED_STATUS,
  UPLOAD_UNAVAILABLE_CODE,
  UPLOAD_UNAVAILABLE_STATUS,
} from "./upload.constants";
import type { UploadRemovalApplication } from "./upload.types";

export async function handleRemoveUpload(
  request: Request,
  path: unknown,
  session: ActiveSession | null,
  removals: UploadRemovalApplication,
  createRequestId: () => string = randomUUID,
): Promise<Response> {
  if (!isSameOriginRequest(request)) {
    return createApiErrorResponse({
      status: UPLOAD_FORBIDDEN_STATUS,
      code: UPLOAD_FORBIDDEN_CODE,
      message: UPLOAD_FORBIDDEN_MESSAGE,
      requestId: createRequestId(),
    });
  }
  if (!session) {
    return createApiErrorResponse({
      status: UPLOAD_UNAUTHENTICATED_STATUS,
      code: UPLOAD_UNAUTHENTICATED_CODE,
      message: UPLOAD_REMOVE_UNAUTHENTICATED_MESSAGE,
      requestId: createRequestId(),
    });
  }
  const parsedPath = UploadAssetPathSchema.safeParse(path);
  if (!parsedPath.success) {
    return createApiErrorResponse({
      status: UPLOAD_BAD_REQUEST_STATUS,
      code: UPLOAD_BAD_REQUEST_CODE,
      message: UPLOAD_INVALID_REQUEST_MESSAGE,
      requestId: createRequestId(),
    });
  }

  try {
    const result = await removals.remove(
      session.userId,
      parsedPath.data.assetId,
    );
    if (result.ok) return new Response(null, { status: 204 });
    const requestId = createRequestId();
    switch (result.reason) {
      case "ASSET_NOT_FOUND":
        return createApiErrorResponse({
          status: UPLOAD_NOT_FOUND_STATUS,
          code: UPLOAD_NOT_FOUND_CODE,
          message: UPLOAD_ASSET_NOT_FOUND_MESSAGE,
          requestId,
        });
      case "ASSET_NOT_REMOVABLE":
        return createApiErrorResponse({
          status: UPLOAD_CONFLICT_STATUS,
          code: UPLOAD_CONFLICT_CODE,
          message: UPLOAD_REMOVE_CONFLICT_MESSAGE,
          requestId,
        });
      case "STORAGE_UNAVAILABLE":
        return createApiErrorResponse({
          status: UPLOAD_UNAVAILABLE_STATUS,
          code: UPLOAD_UNAVAILABLE_CODE,
          message: UPLOAD_REMOVE_UNAVAILABLE_MESSAGE,
          requestId,
        });
    }
  } catch (error) {
    reportUnexpectedError(error, ApplicationErrorCode.INTERNAL_ERROR);
    return createApiErrorResponse({
      status: UPLOAD_UNAVAILABLE_STATUS,
      code: UPLOAD_UNAVAILABLE_CODE,
      message: UPLOAD_REMOVE_UNAVAILABLE_MESSAGE,
      requestId: createRequestId(),
    });
  }
}
