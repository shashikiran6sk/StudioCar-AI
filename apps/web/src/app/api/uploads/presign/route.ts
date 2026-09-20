import { getCurrentSession } from "../../../../server/auth/get-current-session";
import { handleCreateUploadIntent } from "../../../../server/uploads/create-upload-intent-handler";
import { getUploadRuntime } from "../../../../server/uploads/upload-runtime";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const session = await getCurrentSession();
  const runtime = getUploadRuntime();
  return handleCreateUploadIntent(
    request,
    session,
    runtime.service,
    runtime.rateLimiter,
  );
}
