import { getCurrentSession } from "../../../server/auth/get-current-session";
import { handleCreateProcessingBatch } from "../../../server/jobs/create-processing-batch-handler";
import { getProcessingRuntime } from "../../../server/jobs/processing-runtime";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const session = await getCurrentSession();
  return handleCreateProcessingBatch(
    request,
    session,
    getProcessingRuntime().service,
  );
}
