import { afterEach, describe, expect, it, vi } from "vitest";

import { PhotoSource } from "../../../../apps/web/src/features/vehicle-create/photo-source";
import { releasePhotoPreview } from "../../../../apps/web/src/features/vehicle-create/release-photo-preview";
import { uploadedPhoto } from "./studio-selection-test-data";

describe("releasePhotoPreview", () => {
  afterEach(() => vi.restoreAllMocks());

  it("frees the local preview of a chosen file", () => {
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);

    releasePhotoPreview(uploadedPhoto({ previewUrl: "blob:local" }));

    expect(revoke).toHaveBeenCalledWith("blob:local");
  });

  it("leaves a stored original's signed URL alone", () => {
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);

    releasePhotoPreview(
      uploadedPhoto({
        previewUrl: "https://private.s3.test/original.jpg",
        source: PhotoSource.Existing,
      }),
    );

    expect(revoke).not.toHaveBeenCalled();
  });
});
