import { describe, expect, it, vi } from "vitest";

import { CreateUploadIntentService } from "../../../../apps/web/src/server/uploads/create-upload-intent-service";
import type {
  UploadAssetRepositoryPort,
  UploadObjectStoragePort,
} from "../../../../apps/web/src/server/uploads/upload.types";
import { createUploadTestAsset } from "./create-upload-test-asset";

function repository(): UploadAssetRepositoryPort {
  return {
    reservePendingOwned: vi.fn(),
    findOwnedById: vi.fn(),
    markUploadedOwned: vi.fn(),
    markInvalidOwned: vi.fn(),
  };
}

function storage(): UploadObjectStoragePort {
  return {
    createPresignedUpload: vi.fn(async () => ({
      url: "https://assets.example.test/upload",
      headers: { "content-type": "image/png" },
    })),
    headObject: vi.fn(),
    readObjectPrefix: vi.fn(),
  };
}

const command = {
  vehicleId: "22222222-2222-4222-8222-222222222222",
  filename: "vehicle.png",
  mimeType: "image/png",
  sizeBytes: 24,
  checksumSha256: "00".repeat(32),
} satisfies Parameters<CreateUploadIntentService["execute"]>[2];

describe("CreateUploadIntentService", () => {
  it("reserves an immutable asset and returns browser PUT instructions", async () => {
    const assets = repository();
    const objects = storage();
    vi.mocked(assets.reservePendingOwned).mockResolvedValue({
      kind: "CREATED",
      asset: createUploadTestAsset(),
    });
    const service = new CreateUploadIntentService(assets, objects, {
      maximumUploadBytes: 25 * 1024 * 1024,
      presignedUrlTtlSeconds: 300,
      now: () => new Date("2026-09-19T12:00:00.000Z"),
      createId: () => "11111111-1111-4111-8111-111111111111",
    });

    await expect(
      service.execute("user-1", "upload-request-0001", command),
    ).resolves.toMatchObject({
      ok: true,
      response: {
        assetId: "11111111-1111-4111-8111-111111111111",
        method: "PUT",
      },
    });
    expect(assets.reservePendingOwned).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        objectKey: expect.stringContaining("/assets/11111111-1111-4111-8111-111111111111/"),
      }),
    );
    expect(objects.createPresignedUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        contentLength: 24,
        checksumSha256: "00".repeat(32),
      }),
    );
  });

  it("rejects cross-tenant misses, oversized input, and conflicting replays", async () => {
    const assets = repository();
    const objects = storage();
    const service = new CreateUploadIntentService(assets, objects, {
      maximumUploadBytes: 20,
      presignedUrlTtlSeconds: 300,
      now: () => new Date("2026-09-19T12:00:00.000Z"),
    });

    await expect(
      service.execute("user-1", "upload-request-0001", command),
    ).resolves.toEqual({ ok: false, reason: "UPLOAD_LIMIT_EXCEEDED" });

    vi.mocked(assets.reservePendingOwned).mockResolvedValue({
      kind: "VEHICLE_NOT_FOUND",
    });
    const allowedService = new CreateUploadIntentService(assets, objects, {
      maximumUploadBytes: 100,
      presignedUrlTtlSeconds: 300,
    });
    await expect(
      allowedService.execute("user-1", "upload-request-0001", command),
    ).resolves.toEqual({ ok: false, reason: "VEHICLE_NOT_FOUND" });

    vi.mocked(assets.reservePendingOwned).mockResolvedValue({
      kind: "EXISTING",
      asset: createUploadTestAsset({ originalFilename: "different.png" }),
    });
    await expect(
      allowedService.execute("user-1", "upload-request-0001", command),
    ).resolves.toEqual({ ok: false, reason: "IDEMPOTENCY_CONFLICT" });
  });
});
