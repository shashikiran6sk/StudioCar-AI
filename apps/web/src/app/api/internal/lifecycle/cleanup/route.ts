import { handleLifecycleCleanup } from "../../../../../server/lifecycle/handle-lifecycle-cleanup";
import { getLifecycleCleanupRuntime } from "../../../../../server/lifecycle/lifecycle-cleanup-runtime";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const lifecycle = getLifecycleCleanupRuntime();
  return handleLifecycleCleanup(
    request,
    lifecycle.cleanupToken,
    lifecycle.service,
  );
}
