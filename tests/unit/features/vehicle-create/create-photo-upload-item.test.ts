import { describe, expect, it } from "vitest";

import { createPhotoUploadItem } from "../../../../apps/web/src/features/vehicle-create/create-photo-upload-item";
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
      file,
      previewUrl: "blob:vehicle-preview",
      progress: 0,
      status: PhotoUploadStatus.Selected,
    });
  });
});
