import { withRouteMonitoring } from "../../../../server/observability/with-route-monitoring";
import { getCurrentSession } from "../../../../server/auth/get-current-session";
import { handleRemoveUpload } from "../../../../server/uploads/remove-upload-handler";
import { getUploadRemovalService } from "../../../../server/uploads/upload-runtime";

export const runtime = "nodejs";

interface UploadRouteContext {
  params: Promise<{ assetId: string }>;
}

async function handleDELETE(
  request: Request,
  context: UploadRouteContext,
): Promise<Response> {
  const [session, path] = await Promise.all([
    getCurrentSession(),
    context.params,
  ]);
  return handleRemoveUpload(request, path, session, getUploadRemovalService());
}

export const DELETE = withRouteMonitoring(
  "/api/uploads/[assetId]",
  handleDELETE,
);
