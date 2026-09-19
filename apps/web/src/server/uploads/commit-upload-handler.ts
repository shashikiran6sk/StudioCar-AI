import { randomUUID } from "node:crypto";
import {
  CommitUploadPathSchema,
  CommitUploadSchema,
} from "@studiocar/contracts";

import { createApiErrorResponse } from "../auth/create-api-error-response";
import { isSameOriginRequest } from "../auth/is-same-origin-request";
import type { ActiveSession } from "../auth/session-service";
import {
  UPLOAD_ASSET_INVALID_MESSAGE,
  UPLOAD_ASSET_NOT_FOUND_MESSAGE,
  UPLOAD_BAD_REQUEST_CODE,
  UPLOAD_BAD_REQUEST_STATUS,
  UPLOAD_CONFLICT_CODE,
  UPLOAD_CONFLICT_STATUS,
  UPLOAD_FORBIDDEN_CODE,
  UPLOAD_FORBIDDEN_MESSAGE,
  UPLOAD_FORBIDDEN_STATUS,
  UPLOAD_INVALID_REQUEST_MESSAGE,
  UPLOAD_INVALID_STATUS,
  UPLOAD_NOT_FOUND_CODE,
  UPLOAD_NOT_FOUND_STATUS,
  UPLOAD_OBJECT_INVALID_MESSAGE,
  UPLOAD_OBJECT_MISSING_MESSAGE,
  UPLOAD_UNAUTHENTICATED_CODE,
  UPLOAD_UNAUTHENTICATED_MESSAGE,
  UPLOAD_UNAUTHENTICATED_STATUS,
  UPLOAD_UNAVAILABLE_CODE,
  UPLOAD_UNAVAILABLE_MESSAGE,
  UPLOAD_UNAVAILABLE_STATUS,
} from "./upload.constants";
import type { UploadApplication } from "./upload.types";

export async function handleCommitUpload(
  request: Request,
  path: unknown,
  session: ActiveSession | null,
  uploads: UploadApplication,
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
      message: UPLOAD_UNAUTHENTICATED_MESSAGE,
      requestId: createRequestId(),
    });
  }

  const parsedPath = CommitUploadPathSchema.safeParse(path);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const command = CommitUploadSchema.safeParse(body);
  if (!parsedPath.success || !command.success) {
    return createApiErrorResponse({
      status: UPLOAD_BAD_REQUEST_STATUS,
      code: UPLOAD_BAD_REQUEST_CODE,
      message: UPLOAD_INVALID_REQUEST_MESSAGE,
      requestId: createRequestId(),
    });
  }

  try {
    const result = await uploads.commit(
      session.userId,
      parsedPath.data.assetId,
      command.data.etag,
    );
    if (result.ok) return Response.json(result.response);

    const requestId = createRequestId();
    switch (result.reason) {
      case "ASSET_NOT_FOUND":
        return createApiErrorResponse({
          status: UPLOAD_NOT_FOUND_STATUS,
          code: UPLOAD_NOT_FOUND_CODE,
          message: UPLOAD_ASSET_NOT_FOUND_MESSAGE,
          requestId,
        });
      case "ASSET_INVALID":
        return createApiErrorResponse({
          status: UPLOAD_CONFLICT_STATUS,
          code: UPLOAD_CONFLICT_CODE,
          message: UPLOAD_ASSET_INVALID_MESSAGE,
          requestId,
        });
      case "OBJECT_MISSING":
        return createApiErrorResponse({
          status: UPLOAD_CONFLICT_STATUS,
          code: UPLOAD_CONFLICT_CODE,
          message: UPLOAD_OBJECT_MISSING_MESSAGE,
          requestId,
        });
      case "OBJECT_INVALID":
        return createApiErrorResponse({
          status: UPLOAD_INVALID_STATUS,
          code: UPLOAD_BAD_REQUEST_CODE,
          message: UPLOAD_OBJECT_INVALID_MESSAGE,
          requestId,
        });
      case "STORAGE_UNAVAILABLE":
        return createApiErrorResponse({
          status: UPLOAD_UNAVAILABLE_STATUS,
          code: UPLOAD_UNAVAILABLE_CODE,
          message: UPLOAD_UNAVAILABLE_MESSAGE,
          requestId,
        });
    }
  } catch {
    return createApiErrorResponse({
      status: UPLOAD_UNAVAILABLE_STATUS,
      code: UPLOAD_UNAVAILABLE_CODE,
      message: UPLOAD_UNAVAILABLE_MESSAGE,
      requestId: createRequestId(),
    });
  }
}
