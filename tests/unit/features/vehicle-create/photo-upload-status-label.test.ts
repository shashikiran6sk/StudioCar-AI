import { describe, expect, it } from "vitest";

import { photoUploadStatusLabel } from "../../../../apps/web/src/features/vehicle-create/photo-upload-status-label";
import { PhotoUploadStatus } from "../../../../apps/web/src/features/vehicle-create/photo-upload-status";

describe("photoUploadStatusLabel", () => {
  it("uses measured progress only for the upload stage", () => {
    const file = new File(["image"], "vehicle.jpg", { type: "image/jpeg" });
    expect(
      photoUploadStatusLabel({
        assetId: null,
        clientId: "photo-1",
        error: null,
        file,
        height: null,
        previewUrl: "blob:preview",
        progress: 82,
        status: PhotoUploadStatus.Uploading,
        width: null,
      }),
    ).toBe("Uploading 82%");
  });
});
