import { handleDispatchProcessingOutbox } from "../../../../../server/jobs/dispatch-processing-outbox-handler";
import { getProcessingRuntime } from "../../../../../server/jobs/processing-runtime";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const processing = getProcessingRuntime();
  return handleDispatchProcessingOutbox(
    request,
    processing.dispatchToken,
    processing.dispatcher,
  );
}
