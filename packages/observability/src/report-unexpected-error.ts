import { LOG_EVENTS } from "./monitoring.constants";
import { captureException, withScope } from "@sentry/node";
import { ApplicationError } from "./application-error";
import type { MonitoringContext } from "./monitoring.types";
import { monitoringContext } from "./monitoring-context";
import type { ApplicationErrorCode } from "./monitoring.constants";
import { serializeSafeError } from "./serialize-safe-error";
import { logger } from "./structured-logger";

export function reportUnexpectedError(
  error: unknown,
  code: ApplicationErrorCode,
): void {
  try {
    const wrapped = new ApplicationError(code, error);
    const safe = serializeSafeError(error);
    logger.log("error", LOG_EVENTS.UNEXPECTED_EXCEPTION, {
      error,
      errorCode: wrapped.code,
    });
    const exception = new Error(safe.message);
    exception.name = safe.name;
    if (safe.stack) exception.stack = safe.stack;
    withScope((scope) => {
      const context = monitoringContext.getStore();
      for (const key of [
        "requestId",
        "batchId",
        "jobId",
        "route",
        "method",
      ] satisfies readonly (keyof MonitoringContext)[]) {
        const value = context?.[key];
        if (value) scope.setTag(key, value);
      }
      scope.setTag("errorCode", code);
      captureException(exception);
    });
  } catch {
    /* Exception reporting must never change application outcomes. */
  }
}
