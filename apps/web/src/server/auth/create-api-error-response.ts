import { monitoringContext } from "@studiocar/observability";
import type { ApiError, ApiErrorCode } from "@studiocar/contracts";

export interface ApiErrorResponseOptions {
  status: number;
  code: ApiErrorCode;
  message: string;
  requestId: string;
  fieldErrors?: Record<string, string[]>;
  retryAfterSeconds?: number;
}

const RETRY_AFTER_HEADER = "retry-after";

export function createApiErrorResponse(
  options: ApiErrorResponseOptions,
): Response {
  const context = monitoringContext.getStore();
  if (context) context.errorCode = options.code;
  const body: ApiError = {
    error: {
      code: options.code,
      message: options.message,
      requestId: context?.requestId ?? options.requestId,
      ...(options.fieldErrors ? { fieldErrors: options.fieldErrors } : {}),
    },
  };
  const init: ResponseInit = options.retryAfterSeconds
    ? {
        status: options.status,
        headers: { [RETRY_AFTER_HEADER]: String(options.retryAfterSeconds) },
      }
    : { status: options.status };

  return Response.json(body, init);
}
