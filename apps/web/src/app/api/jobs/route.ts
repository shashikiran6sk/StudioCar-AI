import { getCurrentSession } from "../../../server/auth/get-current-session";
import { handleCreateProcessingBatch } from "../../../server/jobs/create-processing-batch-handler";
import { handleGetProcessingStatuses } from "../../../server/jobs/get-processing-status-handler";
import { getProcessingRuntime } from "../../../server/jobs/processing-runtime";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const session = await getCurrentSession();
  return handleGetProcessingStatuses(
    request,
    session,
    getProcessingRuntime().statusService,
  );
}

export async function POST(request: Request): Promise<Response> {
  const session = await getCurrentSession();
  return handleCreateProcessingBatch(
    request,
    session,
    getProcessingRuntime().service,
  );
}
