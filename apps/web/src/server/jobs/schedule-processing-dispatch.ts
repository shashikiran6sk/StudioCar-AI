import { after } from "next/server";
import { ApplicationErrorCode, measureStage, PerformanceStage, reportUnexpectedError } from "@studiocar/observability";
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
        await measureStage(PerformanceStage.DISPATCH, () => dispatcher.dispatch(request));
      } catch (error) {
        reportUnexpectedError(error, ApplicationErrorCode.INTERNAL_ERROR);
      }
    });
  } catch (error) {
    // Acceptance must not become a 500 after the reservation has committed.
    reportUnexpectedError(error, ApplicationErrorCode.INTERNAL_ERROR);
  }
}
