import { randomUUID } from "node:crypto";

import { createApiErrorResponse } from "../auth/create-api-error-response";
import { dispatchTokenIsValid } from "../internal/dispatch-token-is-valid";
import {
  PROCESSING_FORBIDDEN_CODE,
  PROCESSING_FORBIDDEN_MESSAGE,
  PROCESSING_FORBIDDEN_STATUS,
  PROCESSING_UNAVAILABLE_CODE,
  PROCESSING_UNAVAILABLE_MESSAGE,
  PROCESSING_UNAVAILABLE_STATUS,
} from "./processing-job.constants";
import type { ProcessingDispatchPort } from "./processing-job.types";

export async function handleDispatchProcessingOutbox(
  request: Request,
  expectedToken: string,
  dispatcher: ProcessingDispatchPort,
  createRequestId: () => string = randomUUID,
): Promise<Response> {
  if (!dispatchTokenIsValid(request, expectedToken)) {
    return createApiErrorResponse({
      status: PROCESSING_FORBIDDEN_STATUS,
      code: PROCESSING_FORBIDDEN_CODE,
      message: PROCESSING_FORBIDDEN_MESSAGE,
      requestId: createRequestId(),
    });
  }
  try {
    return Response.json(await dispatcher.dispatch());
  } catch {
    return createApiErrorResponse({
      status: PROCESSING_UNAVAILABLE_STATUS,
      code: PROCESSING_UNAVAILABLE_CODE,
      message: PROCESSING_UNAVAILABLE_MESSAGE,
      requestId: createRequestId(),
    });
  }
}
