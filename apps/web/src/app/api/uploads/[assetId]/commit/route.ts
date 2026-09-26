import { withRouteMonitoring } from "../../../../../server/observability/with-route-monitoring";
import { getCurrentSession } from "../../../../../server/auth/get-current-session";
import { handleCommitUpload } from "../../../../../server/uploads/commit-upload-handler";
import { getUploadService } from "../../../../../server/uploads/upload-runtime";

export const runtime = "nodejs";

interface CommitUploadRouteContext {
  params: Promise<{ assetId: string }>;
}

async function handlePOST(
  request: Request,
  context: CommitUploadRouteContext,
): Promise<Response> {
  const [session, path] = await Promise.all([
    getCurrentSession(),
    context.params,
  ]);
  return handleCommitUpload(request, path, session, getUploadService());
}

export const POST = withRouteMonitoring(
  "/api/uploads/[assetId]/commit",
  handlePOST,
);
