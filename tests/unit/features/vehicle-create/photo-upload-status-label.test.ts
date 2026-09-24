import { describe, expect, it } from "vitest";

import { photoUploadStatusLabel } from "../../../../apps/web/src/features/vehicle-create/photo-upload-status-label";
import { PhotoUploadStatus } from "../../../../apps/web/src/features/vehicle-create/photo-upload-status";
import { uploadedPhoto } from "./studio-selection-test-data";

describe("photoUploadStatusLabel", () => {
  it("uses measured progress only for the upload stage", () => {
    expect(
      photoUploadStatusLabel(
        uploadedPhoto({ progress: 82, status: PhotoUploadStatus.Uploading }),
      ),
    ).toBe("Uploading 82%");
    expect(
      photoUploadStatusLabel(
        uploadedPhoto({ status: PhotoUploadStatus.Removing }),
      ),
    ).toBe("Removing");
  });
});
