import { describe, expect, it } from "vitest";

import { createPhotoUploadItem } from "../../../../apps/web/src/features/vehicle-create/create-photo-upload-item";
import { PhotoSource } from "../../../../apps/web/src/features/vehicle-create/photo-source";
import { PhotoUploadStatus } from "../../../../apps/web/src/features/vehicle-create/photo-upload-status";

describe("createPhotoUploadItem", () => {
  it("creates a stable selected item with an owned preview URL", () => {
    const file = new File(["image"], "vehicle.jpg", { type: "image/jpeg" });

    expect(
      createPhotoUploadItem(
        file,
        () => "0e879f46-1193-4d77-b785-057fe026d998",
        () => "blob:vehicle-preview",
      ),
    ).toMatchObject({
      clientId: "0e879f46-1193-4d77-b785-057fe026d998",
      failureReason: null,
      file,
      filename: "vehicle.jpg",
      previewUrl: "blob:vehicle-preview",
      progress: 0,
      replaceRequired: false,
      selected: true,
      sizeBytes: 5,
      source: PhotoSource.Upload,
      status: PhotoUploadStatus.Selected,
    });
  });
});
