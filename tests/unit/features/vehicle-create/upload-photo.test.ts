import { describe, expect, it, vi } from "vitest";

import { createPhotoUploadItem } from "../../../../apps/web/src/features/vehicle-create/create-photo-upload-item";
import { commitPhotoUpload } from "../../../../apps/web/src/features/vehicle-create/commit-photo-upload";
import { hashFileSha256 } from "../../../../apps/web/src/features/vehicle-create/hash-file-sha256";
import { putFileWithProgress } from "../../../../apps/web/src/features/vehicle-create/put-file-with-progress";
import { PhotoUploadStatus } from "../../../../apps/web/src/features/vehicle-create/photo-upload-status";
import { requestUploadIntent } from "../../../../apps/web/src/features/vehicle-create/request-upload-intent";
import { uploadPhoto } from "../../../../apps/web/src/features/vehicle-create/upload-photo";

vi.mock("../../../../apps/web/src/features/vehicle-create/hash-file-sha256", () => ({
  hashFileSha256: vi.fn(),
}));
vi.mock("../../../../apps/web/src/features/vehicle-create/request-upload-intent", () => ({
  requestUploadIntent: vi.fn(),
}));
vi.mock("../../../../apps/web/src/features/vehicle-create/put-file-with-progress", () => ({
  putFileWithProgress: vi.fn(),
}));
vi.mock("../../../../apps/web/src/features/vehicle-create/commit-photo-upload", () => ({
  commitPhotoUpload: vi.fn(),
}));

describe("uploadPhoto", () => {
  it("orchestrates hash, presign, direct PUT, and authoritative commit stages", async () => {
    vi.mocked(hashFileSha256).mockResolvedValue("00".repeat(32));
    vi.mocked(requestUploadIntent).mockResolvedValue({
      assetId: "331a1e25-b9d8-4b1a-a398-8351a58f8c24",
      uploadUrl: "https://storage.example.test/upload",
      method: "PUT",
      headers: { "content-type": "image/jpeg" },
      expiresAt: "2026-09-19T12:05:00.000Z",
    });
    vi.mocked(putFileWithProgress).mockResolvedValue('"etag"');
    vi.mocked(commitPhotoUpload).mockResolvedValue({
      assetId: "331a1e25-b9d8-4b1a-a398-8351a58f8c24",
      status: "UPLOADED",
      mimeType: "image/jpeg",
      sizeBytes: 5,
      width: 1920,
      height: 1080,
    });
    const file = new File(["image"], "vehicle.jpg", { type: "image/jpeg" });
    const onStatus = vi.fn();

    await expect(
      uploadPhoto(
        "0e879f46-1193-4d77-b785-057fe026d998",
        createPhotoUploadItem(
          file,
          () => "0a10d8a2-0c9d-45e4-a503-37ca31a74018",
          () => "blob:preview",
        ),
        { onProgress: vi.fn(), onStatus },
      ),
    ).resolves.toEqual({
      assetId: "331a1e25-b9d8-4b1a-a398-8351a58f8c24",
      width: 1920,
      height: 1080,
    });
    expect(onStatus.mock.calls.map(([status]) => status)).toEqual([
      PhotoUploadStatus.Preparing,
      PhotoUploadStatus.Uploading,
      PhotoUploadStatus.Finalizing,
    ]);
  });

  it("refuses to upload a stored original that has no local file", async () => {
    vi.mocked(requestUploadIntent).mockClear();

    await expect(
      uploadPhoto(
        "0e879f46-1193-4d77-b785-057fe026d998",
        {
          ...createPhotoUploadItem(
            new File(["image"], "vehicle.jpg", { type: "image/jpeg" }),
            () => "0a10d8a2-0c9d-45e4-a503-37ca31a74018",
            () => "blob:preview",
          ),
          file: null,
        },
        { onProgress: vi.fn(), onStatus: vi.fn() },
      ),
    ).rejects.toThrow("Upload failed");
    expect(requestUploadIntent).not.toHaveBeenCalled();
  });
});
