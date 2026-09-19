import { describe, expect, it, vi } from "vitest";

import { CommitUploadService } from "../../../../apps/web/src/server/uploads/commit-upload-service";
import { hexSha256ToBase64 } from "../../../../apps/web/src/server/uploads/hex-sha256-to-base64";
import type {
  UploadAssetRepositoryPort,
  UploadObjectStoragePort,
} from "../../../../apps/web/src/server/uploads/upload.types";
import { createUploadTestAsset } from "./create-upload-test-asset";

function pngHeader(): Uint8Array {
  const bytes = new Uint8Array(24);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x89504e47);
  view.setUint32(4, 0x0d0a1a0a);
  view.setUint32(12, 0x49484452);
  view.setUint32(16, 1920);
  view.setUint32(20, 1080);
  return bytes;
}

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
    createPresignedUpload: vi.fn(),
    headObject: vi.fn(),
    readObjectPrefix: vi.fn(),
  };
}

describe("CommitUploadService", () => {
  it("verifies storage and conditionally marks a pending upload complete", async () => {
    const asset = createUploadTestAsset();
    const assets = repository();
    const objects = storage();
    vi.mocked(assets.findOwnedById).mockResolvedValue(asset);
    vi.mocked(objects.headObject).mockResolvedValue({
      contentLength: 24,
      contentType: "image/png",
      checksumSha256: hexSha256ToBase64("00".repeat(32)),
      etag: '"etag"',
      metadata: {
        "asset-id": asset.id,
        "user-id": asset.userId,
        "vehicle-id": asset.vehicleId,
      },
    });
    vi.mocked(objects.readObjectPrefix).mockResolvedValue(pngHeader());
    vi.mocked(assets.markUploadedOwned).mockResolvedValue(
      createUploadTestAsset({
        status: "UPLOADED",
        width: 1920,
        height: 1080,
        uploadedAt: new Date("2026-09-19T12:01:00.000Z"),
      }),
    );
    const service = new CommitUploadService(assets, objects, {
      maximumImageDimension: 16_384,
      maximumImagePixels: 100_000_000,
      now: () => new Date("2026-09-19T12:01:00.000Z"),
    });

    await expect(
      service.execute("user-1", asset.id, '"etag"'),
    ).resolves.toMatchObject({
      ok: true,
      response: { status: "UPLOADED", width: 1920, height: 1080 },
    });
    expect(assets.markUploadedOwned).toHaveBeenCalledWith(
      "user-1",
      asset.id,
      expect.objectContaining({ width: 1920, height: 1080 }),
    );
  });

  it("is idempotent after completion and rejects missing or invalid objects", async () => {
    const assets = repository();
    const objects = storage();
    const service = new CommitUploadService(assets, objects, {
      maximumImageDimension: 16_384,
      maximumImagePixels: 100_000_000,
    });
    vi.mocked(assets.findOwnedById).mockResolvedValue(
      createUploadTestAsset({ status: "UPLOADED", width: 20, height: 10 }),
    );
    await expect(service.execute("user-1", "asset-1", undefined)).resolves.toMatchObject({
      ok: true,
    });
    expect(objects.headObject).not.toHaveBeenCalled();

    vi.mocked(assets.findOwnedById).mockResolvedValue(createUploadTestAsset());
    vi.mocked(objects.headObject).mockResolvedValue(null);
    await expect(service.execute("user-1", "asset-1", undefined)).resolves.toEqual({
      ok: false,
      reason: "OBJECT_MISSING",
    });

    vi.mocked(objects.headObject).mockResolvedValue({
      contentLength: 99,
      contentType: "image/png",
      checksumSha256: "wrong",
      etag: undefined,
      metadata: {},
    });
    vi.mocked(objects.readObjectPrefix).mockResolvedValue(new Uint8Array());
    vi.mocked(assets.markInvalidOwned).mockResolvedValue(
      createUploadTestAsset({ status: "INVALID" }),
    );
    await expect(service.execute("user-1", "asset-1", undefined)).resolves.toEqual({
      ok: false,
      reason: "OBJECT_INVALID",
    });
    expect(assets.markInvalidOwned).toHaveBeenCalled();
  });
});
