import { withRouteMonitoring } from "../../../server/observability/with-route-monitoring";
import { getCurrentSession } from "../../../server/auth/get-current-session";
import { handleCreateProcessingBatch } from "../../../server/jobs/create-processing-batch-handler";
import { handleGetProcessingStatuses } from "../../../server/jobs/get-processing-status-handler";
import { getProcessingRuntime } from "../../../server/jobs/processing-runtime";

export const runtime = "nodejs";

async function handleGET(request: Request): Promise<Response> {
  const session = await getCurrentSession();
  return handleGetProcessingStatuses(
    request,
    session,
    getProcessingRuntime().statusService,
  );
}

async function handlePOST(request: Request): Promise<Response> {
  const session = await getCurrentSession();
  const runtime = getProcessingRuntime();
  return handleCreateProcessingBatch(
    request,
    session,
    runtime.service,
    runtime.rateLimiter,
  );
}

export const GET = withRouteMonitoring("/api/jobs", handleGET);

export const POST = withRouteMonitoring("/api/jobs", handlePOST);
