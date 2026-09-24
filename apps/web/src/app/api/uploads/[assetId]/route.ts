import { getCurrentSession } from "../../../../server/auth/get-current-session";
import { handleRemoveUpload } from "../../../../server/uploads/remove-upload-handler";
import { getUploadRemovalService } from "../../../../server/uploads/upload-runtime";

export const runtime = "nodejs";

interface UploadRouteContext {
  params: Promise<{ assetId: string }>;
}

export async function DELETE(
  request: Request,
  context: UploadRouteContext,
): Promise<Response> {
  const [session, path] = await Promise.all([
    getCurrentSession(),
    context.params,
  ]);
  return handleRemoveUpload(
    request,
    path,
    session,
    getUploadRemovalService(),
  );
}
