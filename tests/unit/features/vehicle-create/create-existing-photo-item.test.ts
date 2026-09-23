import { describe, expect, it } from "vitest";

import { createExistingPhotoItem } from "../../../../apps/web/src/features/vehicle-create/create-existing-photo-item";
import { PhotoSource } from "../../../../apps/web/src/features/vehicle-create/photo-source";
import { PhotoUploadStatus } from "../../../../apps/web/src/features/vehicle-create/photo-upload-status";
import { failedSelectionContext } from "./studio-selection-test-data";

const [succeeded, failed, unusable] = failedSelectionContext("REPLACE_FAILED").images;

describe("createExistingPhotoItem", () => {
  it("represents a stored original as an uploaded row with no local file", () => {
    if (!succeeded) throw new Error("Fixture image missing.");

    expect(createExistingPhotoItem(succeeded)).toEqual({
      assetId: succeeded.assetId,
      clientId: succeeded.assetId,
      error: null,
      failureReason: null,
      file: null,
      filename: "front.jpg",
      height: 1080,
      previewUrl: succeeded.previewUrl,
      progress: 100,
      replaceRequired: false,
      selected: false,
      sizeBytes: 2_048,
      source: PhotoSource.Existing,
      status: PhotoUploadStatus.Uploaded,
      width: 1920,
    });
  });

  it("keeps a failed photo's reason and selection", () => {
    if (!failed) throw new Error("Fixture image missing.");

    expect(createExistingPhotoItem(failed)).toMatchObject({
      failureReason: "SERVICE_UNAVAILABLE",
      selected: true,
    });
  });

  it("never selects an original that must be replaced", () => {
    if (!unusable) throw new Error("Fixture image missing.");

    expect(
      createExistingPhotoItem({ ...unusable, selected: true }),
    ).toMatchObject({ replaceRequired: true, selected: false });
  });
});
