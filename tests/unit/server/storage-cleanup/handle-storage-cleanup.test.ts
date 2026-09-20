import { describe, expect, it, vi } from "vitest";

import { handleStorageCleanup } from "../../../../apps/web/src/server/storage-cleanup/handle-storage-cleanup";
import type { StorageCleanupApplication } from "../../../../apps/web/src/server/storage-cleanup/storage-cleanup.types";

const ENDPOINT = "https://app.studiocar.test/api/internal/storage/cleanup";
const TOKEN = "storage-cleanup-token-at-least-32-characters";

function request(token: string): Request {
  return new Request(ENDPOINT, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
  });
}

describe("handleStorageCleanup", () => {
  it("rejects invalid credentials without running cleanup", async () => {
    const cleanup: StorageCleanupApplication = { run: vi.fn() };
    const response = await handleStorageCleanup(
      request("wrong-token"),
      TOKEN,
      cleanup,
      () => "request-forbidden",
    );

    expect(response.status).toBe(403);
    expect(cleanup.run).not.toHaveBeenCalled();
  });

  it("returns private counts and maps infrastructure failures", async () => {
    const cleanup: StorageCleanupApplication = {
      run: vi
        .fn()
        .mockResolvedValueOnce({
          claimConflicts: 0,
          claimed: 1,
          deleted: 1,
          failed: 0,
          reserved: 1,
          retrying: 0,
        })
        .mockRejectedValueOnce(new Error("database unavailable")),
    };
    const success = await handleStorageCleanup(request(TOKEN), TOKEN, cleanup);
    const unavailable = await handleStorageCleanup(
      request(TOKEN),
      TOKEN,
      cleanup,
      () => "request-unavailable",
    );

    expect(success.status).toBe(200);
    expect(success.headers.get("cache-control")).toBe("no-store");
    await expect(success.json()).resolves.toMatchObject({ deleted: 1 });
    expect(unavailable.status).toBe(503);
  });
});
