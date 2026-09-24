import { describe, expect, it, vi } from "vitest";

import { RemoveUploadService } from "../../../../apps/web/src/server/uploads/remove-upload-service";
import type { ReserveUserUploadRemovalResult } from "../../../../apps/web/src/server/db/repositories/storage-deletion-repository.types";
import type { UserUploadRemovalRepositoryPort } from "../../../../apps/web/src/server/storage-cleanup/storage-cleanup.types";

const NOW = new Date("2026-09-24T12:00:00.000Z");
const ASSET_ID = "11111111-1111-4111-8111-111111111111";
const OBJECT_KEY = "users/user-1/assets/asset-1/original/source.jpg";

function repository(): UserUploadRemovalRepositoryPort {
  return {
    reserveUserUploadRemoval: vi.fn(async (): Promise<ReserveUserUploadRemovalResult> => ({
      kind: "RESERVED",
      messageId: "deletion-1",
      objectKey: OBJECT_KEY,
    })),
    completeUserUploadRemoval: vi.fn(async () => true),
  };
}

describe("RemoveUploadService", () => {
  it("deletes the repository-owned object and completes its durable intent", async () => {
    const removals = repository();
    const storage = { deleteObject: vi.fn() };
    const service = new RemoveUploadService(removals, storage, () => NOW);

    await expect(service.remove("user-1", ASSET_ID)).resolves.toEqual({
      ok: true,
    });
    expect(removals.reserveUserUploadRemoval).toHaveBeenCalledWith({
      assetId: ASSET_ID,
      now: NOW,
      userId: "user-1",
    });
    expect(storage.deleteObject).toHaveBeenCalledWith(OBJECT_KEY);
    expect(removals.completeUserUploadRemoval).toHaveBeenCalledWith({
      deletedAt: NOW,
      messageId: "deletion-1",
    });
  });

  it.each<["NOT_FOUND" | "NOT_REMOVABLE", "ASSET_NOT_FOUND" | "ASSET_NOT_REMOVABLE"]>([
    ["NOT_FOUND", "ASSET_NOT_FOUND"],
    ["NOT_REMOVABLE", "ASSET_NOT_REMOVABLE"],
  ])("maps %s without touching storage", async (kind, reason) => {
    const removals = repository();
    vi.mocked(removals.reserveUserUploadRemoval).mockResolvedValue({ kind });
    const storage = { deleteObject: vi.fn() };
    const service = new RemoveUploadService(removals, storage, () => NOW);

    await expect(service.remove("user-1", ASSET_ID)).resolves.toEqual({
      ok: false,
      reason,
    });
    expect(storage.deleteObject).not.toHaveBeenCalled();
  });

  it("treats a completed repeated delete as success", async () => {
    const removals = repository();
    vi.mocked(removals.reserveUserUploadRemoval).mockResolvedValue({
      kind: "ALREADY_DELETED",
    });
    const storage = { deleteObject: vi.fn() };
    const service = new RemoveUploadService(removals, storage, () => NOW);

    await expect(service.remove("user-1", ASSET_ID)).resolves.toEqual({
      ok: true,
    });
    expect(storage.deleteObject).not.toHaveBeenCalled();
  });

  it("leaves the durable intent incomplete when S3 deletion fails", async () => {
    const removals = repository();
    const storage = {
      deleteObject: vi.fn(async () => {
        throw new Error("storage unavailable");
      }),
    };
    const service = new RemoveUploadService(removals, storage, () => NOW);

    await expect(service.remove("user-1", ASSET_ID)).resolves.toEqual({
      ok: false,
      reason: "STORAGE_UNAVAILABLE",
    });
    expect(removals.completeUserUploadRemoval).not.toHaveBeenCalled();
  });
});
