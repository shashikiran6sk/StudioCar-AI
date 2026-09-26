import { withRouteMonitoring } from "../../../../../server/observability/with-route-monitoring";
import { handleLifecycleCleanup } from "../../../../../server/lifecycle/handle-lifecycle-cleanup";
import { getLifecycleCleanupRuntime } from "../../../../../server/lifecycle/lifecycle-cleanup-runtime";

export const runtime = "nodejs";

async function handlePOST(request: Request): Promise<Response> {
  const lifecycle = getLifecycleCleanupRuntime();
  return handleLifecycleCleanup(
    request,
    lifecycle.cleanupToken,
    lifecycle.service,
  );
}

export const POST = withRouteMonitoring(
  "/api/internal/lifecycle/cleanup",
  handlePOST,
);
