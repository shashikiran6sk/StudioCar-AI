import { LOG_EVENTS } from "@studiocar/observability";
import { randomUUID } from "node:crypto";
import { after } from "next/server";
import {
  ApplicationErrorCode,
  createCloudWatchHttpMetrics,
  createHttpMetrics,
  flushErrorTracking,
  logger,
  monitoringContext,
  REQUEST_ID_HEADER,
  reportUnexpectedError,
  UUID_PATTERN,
} from "@studiocar/observability";
import { createApiErrorResponse } from "../auth/create-api-error-response";

export function withRouteMonitoring<Args extends unknown[]>(
  route: string,
  handler: (request: Request, ...args: Args) => Response | Promise<Response>,
): (request: Request, ...args: Args) => Promise<Response> {
  return async (request, ...args) => {
    const suppliedId = request.headers.get(REQUEST_ID_HEADER);
    const requestId =
      suppliedId && UUID_PATTERN.test(suppliedId) ? suppliedId : randomUUID();
    return monitoringContext.run(
      { requestId, route, method: request.method },
      async () => {
        const startedAt = performance.now();
        let response: Response;
        try {
          response = await handler(request, ...args);
        } catch (error) {
          reportUnexpectedError(error, ApplicationErrorCode.INTERNAL_ERROR);
          response = createApiErrorResponse({
            status: 500,
            code: "INTERNAL_ERROR",
            message: "The request could not be completed.",
            requestId,
          });
        }
        const durationMs = Math.max(0, performance.now() - startedAt);
        const errorCode = monitoringContext.getStore()?.errorCode;
        logger.log(
          response.status >= 500
            ? "error"
            : response.status >= 400
              ? "warn"
              : "info",
          LOG_EVENTS.HTTP_COMPLETED,
          {
            statusCode: response.status,
            durationMs,
            ...(errorCode ? { errorCode } : {}),
          },
        );
        const headers = new Headers(response.headers);
        headers.set(REQUEST_ID_HEADER, requestId);
        const correlatedResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
        // Next keeps the invocation alive without adding network time to the response.
        try {
          after(async () => {
            try {
              await createCloudWatchHttpMetrics(process.env)?.record(
                createHttpMetrics(response.status, durationMs),
              );
            } catch {
              logger.log("warn", LOG_EVENTS.HTTP_CONFIGURATION_FAILED);
            }
            await flushErrorTracking();
          });
        } catch {
          /* Unit callers have no Next invocation lifecycle. */
        }
        return correlatedResponse;
      },
    );
  };
}
