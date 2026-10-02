import { withRouteMonitoring } from "../../../../../server/observability/with-route-monitoring";
import { handleDispatchProcessingOutbox } from "../../../../../server/jobs/dispatch-processing-outbox-handler";
import { getProcessingRuntime } from "../../../../../server/jobs/processing-runtime";

export const runtime = "nodejs";

async function handlePOST(request: Request): Promise<Response> {
  const processing = getProcessingRuntime();
  return handleDispatchProcessingOutbox(
    request,
    processing.dispatchToken,
    processing.dispatcher,
  );
}

export const POST = withRouteMonitoring(
  "/api/internal/jobs/dispatch",
  handlePOST,
);
