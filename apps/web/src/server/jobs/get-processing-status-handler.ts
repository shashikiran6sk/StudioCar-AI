import {
  ApplicationErrorCode,
  reportUnexpectedError,
} from "@studiocar/observability";
import { randomUUID } from "node:crypto";
import {
  JobStatusQuerySchema,
  JobStatusResponseSchema,
} from "@studiocar/contracts";

import { createApiErrorResponse } from "../auth/create-api-error-response";
import type { ActiveSession } from "../auth/session-service";
import {
  PROCESSING_STATUS_BAD_REQUEST_CODE,
  PROCESSING_STATUS_BAD_REQUEST_MESSAGE,
  PROCESSING_STATUS_BAD_REQUEST_STATUS,
  PROCESSING_STATUS_CACHE_CONTROL,
  PROCESSING_STATUS_CACHE_CONTROL_HEADER,
  PROCESSING_STATUS_IDS_PARAMETER,
  PROCESSING_STATUS_NOT_FOUND_CODE,
  PROCESSING_STATUS_NOT_FOUND_MESSAGE,
  PROCESSING_STATUS_NOT_FOUND_STATUS,
  PROCESSING_STATUS_UNAUTHENTICATED_CODE,
  PROCESSING_STATUS_UNAUTHENTICATED_MESSAGE,
  PROCESSING_STATUS_UNAUTHENTICATED_STATUS,
  PROCESSING_STATUS_UNAVAILABLE_CODE,
  PROCESSING_STATUS_UNAVAILABLE_MESSAGE,
  PROCESSING_STATUS_UNAVAILABLE_STATUS,
} from "./processing-status.constants";
import type { ProcessingStatusApplication } from "./processing-status.types";

export async function handleGetProcessingStatuses(
  request: Request,
  session: ActiveSession | null,
  statuses: ProcessingStatusApplication,
  createRequestId: () => string = randomUUID,
): Promise<Response> {
  if (!session) {
    return createApiErrorResponse({
      code: PROCESSING_STATUS_UNAUTHENTICATED_CODE,
      message: PROCESSING_STATUS_UNAUTHENTICATED_MESSAGE,
      requestId: createRequestId(),
      status: PROCESSING_STATUS_UNAUTHENTICATED_STATUS,
    });
  }
  const rawIds = new URL(request.url).searchParams.get(
    PROCESSING_STATUS_IDS_PARAMETER,
  );
  const query = JobStatusQuerySchema.safeParse({
    ids: rawIds?.split(",").filter(Boolean) ?? [],
  });
  if (!query.success) {
    return createApiErrorResponse({
      code: PROCESSING_STATUS_BAD_REQUEST_CODE,
      message: PROCESSING_STATUS_BAD_REQUEST_MESSAGE,
      requestId: createRequestId(),
      status: PROCESSING_STATUS_BAD_REQUEST_STATUS,
    });
  }

  try {
    const result = await statuses.getStatuses(session.userId, query.data);
    if (!result.ok) {
      return createApiErrorResponse({
        code: PROCESSING_STATUS_NOT_FOUND_CODE,
        message: PROCESSING_STATUS_NOT_FOUND_MESSAGE,
        requestId: createRequestId(),
        status: PROCESSING_STATUS_NOT_FOUND_STATUS,
      });
    }
    return Response.json(JobStatusResponseSchema.parse(result.response), {
      headers: {
        [PROCESSING_STATUS_CACHE_CONTROL_HEADER]: PROCESSING_STATUS_CACHE_CONTROL,
      },
    });
  } catch (error) {
    reportUnexpectedError(error, ApplicationErrorCode.INTERNAL_ERROR);
    return createApiErrorResponse({
      code: PROCESSING_STATUS_UNAVAILABLE_CODE,
      message: PROCESSING_STATUS_UNAVAILABLE_MESSAGE,
      requestId: createRequestId(),
      status: PROCESSING_STATUS_UNAVAILABLE_STATUS,
    });
  }
}
