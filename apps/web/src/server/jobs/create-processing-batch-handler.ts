import { randomUUID } from "node:crypto";
import {
  CreateProcessingBatchSchema,
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
  PROCESSING_ACCEPTED_STATUS,
  PROCESSING_ASSETS_NOT_READY_MESSAGE,
  PROCESSING_BAD_REQUEST_CODE,
  PROCESSING_BAD_REQUEST_STATUS,
  PROCESSING_CACHE_CONTROL_HEADER,
  PROCESSING_CONFLICT_CODE,
  PROCESSING_CONFLICT_STATUS,
  PROCESSING_FORBIDDEN_CODE,
  PROCESSING_FORBIDDEN_MESSAGE,
  PROCESSING_FORBIDDEN_STATUS,
  PROCESSING_IDEMPOTENCY_CONFLICT_MESSAGE,
  PROCESSING_IDEMPOTENCY_HEADER,
  PROCESSING_INVALID_IDEMPOTENCY_MESSAGE,
  PROCESSING_INVALID_REQUEST_MESSAGE,
  PROCESSING_NOT_FOUND_CODE,
  PROCESSING_NOT_FOUND_MESSAGE,
  PROCESSING_NOT_FOUND_STATUS,
  PROCESSING_PRIVATE_CACHE_CONTROL,
  PROCESSING_RATE_LIMITED_MESSAGE,
  PROCESSING_UNAUTHENTICATED_CODE,
  PROCESSING_UNAUTHENTICATED_MESSAGE,
  PROCESSING_UNAUTHENTICATED_STATUS,
  PROCESSING_UNAVAILABLE_CODE,
  PROCESSING_UNAVAILABLE_MESSAGE,
  PROCESSING_UNAVAILABLE_STATUS,
  PROCESSING_VEHICLE_NOT_DRAFT_MESSAGE,
} from "./processing-job.constants";
import type { ProcessingJobApplication } from "./processing-job.types";

export async function handleCreateProcessingBatch(
  request: Request,
  session: ActiveSession | null,
  jobs: ProcessingJobApplication,
  rateLimiter: CommandRateLimiterPort,
  createRequestId: () => string = randomUUID,
): Promise<Response> {
  if (!isSameOriginRequest(request)) {
    return createApiErrorResponse({
      status: PROCESSING_FORBIDDEN_STATUS,
      code: PROCESSING_FORBIDDEN_CODE,
      message: PROCESSING_FORBIDDEN_MESSAGE,
      requestId: createRequestId(),
    });
  }
  if (!session) {
    return createApiErrorResponse({
      status: PROCESSING_UNAUTHENTICATED_STATUS,
      code: PROCESSING_UNAUTHENTICATED_CODE,
      message: PROCESSING_UNAUTHENTICATED_MESSAGE,
      requestId: createRequestId(),
    });
  }
  const idempotencyKey = IdempotencyKeySchema.safeParse(
    request.headers.get(PROCESSING_IDEMPOTENCY_HEADER),
  );
  if (!idempotencyKey.success) {
    return createApiErrorResponse({
      status: PROCESSING_BAD_REQUEST_STATUS,
      code: PROCESSING_BAD_REQUEST_CODE,
      message: PROCESSING_INVALID_IDEMPOTENCY_MESSAGE,
      requestId: createRequestId(),
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = undefined;
  }
  const command = CreateProcessingBatchSchema.safeParse(body);
  if (!command.success) {
    return createApiErrorResponse({
      status: PROCESSING_BAD_REQUEST_STATUS,
      code: PROCESSING_BAD_REQUEST_CODE,
      message: PROCESSING_INVALID_REQUEST_MESSAGE,
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
        message: PROCESSING_RATE_LIMITED_MESSAGE,
        requestId: createRequestId(),
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      });
    }

    const result = await jobs.createBatch(
      session.userId,
      idempotencyKey.data,
      command.data,
    );
    if (result.ok) {
      return Response.json(result.response, {
        status: PROCESSING_ACCEPTED_STATUS,
        headers: {
          [PROCESSING_CACHE_CONTROL_HEADER]: PROCESSING_PRIVATE_CACHE_CONTROL,
        },
      });
    }
    const error = result.reason;
    if (error === "VEHICLE_NOT_FOUND") {
      return createApiErrorResponse({
        status: PROCESSING_NOT_FOUND_STATUS,
        code: PROCESSING_NOT_FOUND_CODE,
        message: PROCESSING_NOT_FOUND_MESSAGE,
        requestId: createRequestId(),
      });
    }
    return createApiErrorResponse({
      status: PROCESSING_CONFLICT_STATUS,
      code: PROCESSING_CONFLICT_CODE,
      message:
        error === "ASSETS_NOT_READY"
          ? PROCESSING_ASSETS_NOT_READY_MESSAGE
          : error === "IDEMPOTENCY_CONFLICT"
            ? PROCESSING_IDEMPOTENCY_CONFLICT_MESSAGE
            : PROCESSING_VEHICLE_NOT_DRAFT_MESSAGE,
      requestId: createRequestId(),
    });
  } catch {
    return createApiErrorResponse({
      status: PROCESSING_UNAVAILABLE_STATUS,
      code: PROCESSING_UNAVAILABLE_CODE,
      message: PROCESSING_UNAVAILABLE_MESSAGE,
      requestId: createRequestId(),
    });
  }
}
