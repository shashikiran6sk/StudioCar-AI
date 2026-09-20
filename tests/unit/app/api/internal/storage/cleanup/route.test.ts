import { describe, expect, it, vi } from "vitest";

import { POST } from "../../../../../../../apps/web/src/app/api/internal/storage/cleanup/route";
import { handleStorageCleanup } from "../../../../../../../apps/web/src/server/storage-cleanup/handle-storage-cleanup";
import { getStorageCleanupRuntime } from "../../../../../../../apps/web/src/server/storage-cleanup/storage-cleanup-runtime";
import { StorageCleanupService } from "../../../../../../../apps/web/src/server/storage-cleanup/storage-cleanup-service";

vi.mock(
  "../../../../../../../apps/web/src/server/storage-cleanup/storage-cleanup-runtime",
  () => ({ getStorageCleanupRuntime: vi.fn() }),
);
vi.mock(
  "../../../../../../../apps/web/src/server/storage-cleanup/handle-storage-cleanup",
  () => ({
    handleStorageCleanup: vi.fn(
      async () => new Response(null, { status: 200 }),
    ),
  }),
);

describe("POST /api/internal/storage/cleanup", () => {
  it("delegates to the protected storage cleanup handler", async () => {
    const service = new StorageCleanupService(
      {
        reserveExpiredPendingUploads: vi.fn(),
        claimPendingDeletions: vi.fn(),
        markDeletionCompleted: vi.fn(),
        releaseDeletionClaim: vi.fn(),
        markDeletionFailed: vi.fn(),
      },
      { deleteObject: vi.fn() },
      {
        batchSize: 10,
        claimTtlMilliseconds: 120_000,
        maximumAttempts: 8,
        retentionMilliseconds: 86_400_000,
        retryBaseMilliseconds: 30_000,
        retryMaximumMilliseconds: 3_600_000,
      },
    );
    const cleanupToken = "storage-cleanup-token-at-least-32-characters";
    vi.mocked(getStorageCleanupRuntime).mockReturnValue({
      cleanupToken,
      service,
    });
    const request = new Request(
      "https://app.studiocar.test/api/internal/storage/cleanup",
      { method: "POST" },
    );

    expect((await POST(request)).status).toBe(200);
    expect(handleStorageCleanup).toHaveBeenCalledWith(
      request,
      cleanupToken,
      service,
    );
  });
});
