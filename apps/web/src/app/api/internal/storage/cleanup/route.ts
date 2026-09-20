import { handleStorageCleanup } from "../../../../../server/storage-cleanup/handle-storage-cleanup";
import { getStorageCleanupRuntime } from "../../../../../server/storage-cleanup/storage-cleanup-runtime";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const storageCleanup = getStorageCleanupRuntime();
  return handleStorageCleanup(
    request,
    storageCleanup.cleanupToken,
    storageCleanup.service,
  );
}
