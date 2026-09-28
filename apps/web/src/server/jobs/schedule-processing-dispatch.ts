import { after } from "next/server";
import { ApplicationErrorCode, reportUnexpectedError } from "@studiocar/observability";
import type { ProcessingOutboxDispatchRequest } from "@studiocar/processing";

import type { ProcessingDispatchPort } from "./processing-job.types";

/** The committed outbox remains recoverable if this invocation cannot publish. */
export function scheduleProcessingDispatch(
  dispatcher: ProcessingDispatchPort,
  request: ProcessingOutboxDispatchRequest,
): void {
  try {
    after(async () => {
      try {
        await dispatcher.dispatch(request);
      } catch (error) {
        reportUnexpectedError(error, ApplicationErrorCode.INTERNAL_ERROR);
      }
    });
  } catch (error) {
    // Acceptance must not become a 500 after the reservation has committed.
    reportUnexpectedError(error, ApplicationErrorCode.INTERNAL_ERROR);
  }
}
