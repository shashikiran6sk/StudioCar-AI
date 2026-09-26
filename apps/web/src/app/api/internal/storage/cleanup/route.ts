import { withRouteMonitoring } from "../../../../../server/observability/with-route-monitoring";
import { handleStorageCleanup } from "../../../../../server/storage-cleanup/handle-storage-cleanup";
import { getStorageCleanupRuntime } from "../../../../../server/storage-cleanup/storage-cleanup-runtime";

export const runtime = "nodejs";

async function handlePOST(request: Request): Promise<Response> {
  const storageCleanup = getStorageCleanupRuntime();
  return handleStorageCleanup(
    request,
    storageCleanup.cleanupToken,
    storageCleanup.service,
  );
}

export const POST = withRouteMonitoring(
  "/api/internal/storage/cleanup",
  handlePOST,
);
