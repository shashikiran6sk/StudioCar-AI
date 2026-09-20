import { randomUUID } from "node:crypto";
import {
  CreateUploadIntentSchema,
  IdempotencyKeySchema,
} from "@studiocar/contracts";

import { createApiErrorResponse } from "../auth/create-api-error-response";
import { isSameOriginRequest } from "../auth/is-same-origin-request";
import type { ActiveSession } from "../auth/session-service";
import {
  COMMAND_RATE_LIMITED_CODE,
  COMMAND_RATE_LIMITED_STATUS,
} from "../security/command-rate-limiter.constants";
import type { CommandRateLimiterPort } from "../security/command-rate-limiter.types";
import {
  IDEMPOTENCY_HEADER,
  CACHE_CONTROL_HEADER,
  PRIVATE_RESPONSE_CACHE_CONTROL,
  UPLOAD_BAD_REQUEST_CODE,
  UPLOAD_BAD_REQUEST_STATUS,
  UPLOAD_CONFLICT_CODE,
  UPLOAD_CONFLICT_STATUS,
  UPLOAD_FORBIDDEN_CODE,
  UPLOAD_FORBIDDEN_MESSAGE,
  UPLOAD_FORBIDDEN_STATUS,
  UPLOAD_IDEMPOTENCY_CONFLICT_MESSAGE,
  UPLOAD_INVALID_IDEMPOTENCY_MESSAGE,
  UPLOAD_INVALID_REQUEST_MESSAGE,
  UPLOAD_LIMIT_EXCEEDED_MESSAGE,
  UPLOAD_NOT_FOUND_CODE,
  UPLOAD_NOT_FOUND_STATUS,
  UPLOAD_RATE_LIMITED_MESSAGE,
  UPLOAD_UNAUTHENTICATED_CODE,
  UPLOAD_UNAUTHENTICATED_MESSAGE,
  UPLOAD_UNAUTHENTICATED_STATUS,
  UPLOAD_UNAVAILABLE_CODE,
  UPLOAD_UNAVAILABLE_MESSAGE,
  UPLOAD_UNAVAILABLE_STATUS,
  UPLOAD_VEHICLE_NOT_FOUND_MESSAGE,
} from "./upload.constants";
import type { UploadApplication } from "./upload.types";

const UPLOAD_CREATED_STATUS = 201;

export async function handleCreateUploadIntent(
  request: Request,
  session: ActiveSession | null,
  uploads: UploadApplication,
  rateLimiter: CommandRateLimiterPort,
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

  const idempotencyKey = IdempotencyKeySchema.safeParse(
    request.headers.get(IDEMPOTENCY_HEADER),
  );
  if (!idempotencyKey.success) {
    return createApiErrorResponse({
      status: UPLOAD_BAD_REQUEST_STATUS,
      code: UPLOAD_BAD_REQUEST_CODE,
      message: UPLOAD_INVALID_IDEMPOTENCY_MESSAGE,
      requestId: createRequestId(),
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createApiErrorResponse({
      status: UPLOAD_BAD_REQUEST_STATUS,
      code: UPLOAD_BAD_REQUEST_CODE,
      message: UPLOAD_INVALID_REQUEST_MESSAGE,
      requestId: createRequestId(),
    });
  }
  const command = CreateUploadIntentSchema.safeParse(body);
  if (!command.success) {
    return createApiErrorResponse({
      status: UPLOAD_BAD_REQUEST_STATUS,
      code: UPLOAD_BAD_REQUEST_CODE,
      message: UPLOAD_INVALID_REQUEST_MESSAGE,
      fieldErrors: command.error.flatten().fieldErrors,
      requestId: createRequestId(),
    });
  }

  try {
    const rateLimit = await rateLimiter.consume(session.userId);
    if (!rateLimit.allowed) {
      return createApiErrorResponse({
        status: COMMAND_RATE_LIMITED_STATUS,
        code: COMMAND_RATE_LIMITED_CODE,
        message: UPLOAD_RATE_LIMITED_MESSAGE,
        requestId: createRequestId(),
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      });
    }

    const result = await uploads.createIntent(
      session.userId,
      idempotencyKey.data,
      command.data,
    );
    if (result.ok) {
      return Response.json(result.response, {
        status: UPLOAD_CREATED_STATUS,
        headers: {
          [CACHE_CONTROL_HEADER]: PRIVATE_RESPONSE_CACHE_CONTROL,
        },
      });
    }
    if (result.reason === "VEHICLE_NOT_FOUND") {
      return createApiErrorResponse({
        status: UPLOAD_NOT_FOUND_STATUS,
        code: UPLOAD_NOT_FOUND_CODE,
        message: UPLOAD_VEHICLE_NOT_FOUND_MESSAGE,
        requestId: createRequestId(),
      });
    }
    if (result.reason === "IDEMPOTENCY_CONFLICT") {
      return createApiErrorResponse({
        status: UPLOAD_CONFLICT_STATUS,
        code: UPLOAD_CONFLICT_CODE,
        message: UPLOAD_IDEMPOTENCY_CONFLICT_MESSAGE,
        requestId: createRequestId(),
      });
    }
    if (result.reason === "UPLOAD_LIMIT_EXCEEDED") {
      return createApiErrorResponse({
        status: UPLOAD_BAD_REQUEST_STATUS,
        code: UPLOAD_BAD_REQUEST_CODE,
        message: UPLOAD_LIMIT_EXCEEDED_MESSAGE,
        requestId: createRequestId(),
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

  return createApiErrorResponse({
    status: UPLOAD_UNAVAILABLE_STATUS,
    code: UPLOAD_UNAVAILABLE_CODE,
    message: UPLOAD_UNAVAILABLE_MESSAGE,
    requestId: createRequestId(),
  });
}
