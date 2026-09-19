import { getCurrentSession } from "../../../../../server/auth/get-current-session";
import { handleCommitUpload } from "../../../../../server/uploads/commit-upload-handler";
import { getUploadService } from "../../../../../server/uploads/upload-runtime";

export const runtime = "nodejs";

interface CommitUploadRouteContext {
  params: Promise<{ assetId: string }>;
}

export async function POST(
  request: Request,
  context: CommitUploadRouteContext,
): Promise<Response> {
  const [session, path] = await Promise.all([
    getCurrentSession(),
    context.params,
  ]);
  return handleCommitUpload(request, path, session, getUploadService());
}
