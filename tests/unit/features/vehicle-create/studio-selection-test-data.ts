import type { StudioSelectionContext } from "../../../../packages/contracts/src/studio-selection";
import { PhotoSource } from "../../../../apps/web/src/features/vehicle-create/photo-source";
import type { PhotoUploadItem } from "../../../../apps/web/src/features/vehicle-create/photo-upload.types";
import { PhotoUploadStatus } from "../../../../apps/web/src/features/vehicle-create/photo-upload-status";

export const VEHICLE_ID = "0e879f46-1193-4d77-b785-057fe026d998";
export const FIRST_ASSET_ID = "331a1e25-b9d8-4b1a-a398-8351a58f8c24";
export const SECOND_ASSET_ID = "442b2f36-cae9-4c2b-b4a9-9462b69f9d35";
export const THIRD_ASSET_ID = "553c3047-dbfa-4d3c-85ba-a573c7a0ae46";

export function uploadedPhoto(
  overrides: Partial<PhotoUploadItem> = {},
): PhotoUploadItem {
  return {
    assetId: FIRST_ASSET_ID,
    clientId: "photo-1",
    error: null,
    failureReason: null,
    file: new File(["image"], "vehicle.jpg", { type: "image/jpeg" }),
    filename: "vehicle.jpg",
    height: 1080,
    previewUrl: "blob:preview",
    progress: 100,
    replaceRequired: false,
    selected: true,
    sizeBytes: 5,
    source: PhotoSource.Upload,
    status: PhotoUploadStatus.Uploaded,
    width: 1920,
    ...overrides,
  };
}

const IMAGE_BASE = {
  height: 1080,
  previewUrl: "https://private.s3.test/original.jpg?signature=1",
  sizeBytes: 2_048,
  width: 1920,
};

export function selectionContext(
  overrides: Partial<StudioSelectionContext> = {},
): StudioSelectionContext {
  return {
    images: [
      {
        ...IMAGE_BASE,
        assetId: FIRST_ASSET_ID,
        displayOrder: 0,
        failureReason: null,
        originalFilename: "front.jpg",
        replaceRequired: false,
        selected: true,
      },
      {
        ...IMAGE_BASE,
        assetId: SECOND_ASSET_ID,
        displayOrder: 1,
        failureReason: null,
        originalFilename: "side.jpg",
        replaceRequired: false,
        selected: true,
      },
    ],
    mode: "CREATE_VARIANT",
    options: {
      background: "PREMIUM_WHITE",
      crop: "MAINTAIN_COMPOSITION",
      enhancement: true,
      floor: "HORIZON",
      outputFormat: "JPEG",
      paddingPercent: 8,
      platePrivacy: true,
      quality: 90,
      shadow: "NATURAL",
    },
    vehicle: {
      brand: "BMW",
      id: VEHICLE_ID,
      model: "X1",
      name: "2024 BMW X1",
      stockId: "SC-1",
      variant: null,
      year: 2024,
    },
    ...overrides,
  };
}

/** A failed batch: one photo succeeded, one failed, one cannot be read. */
export function failedSelectionContext(
  mode: StudioSelectionContext["mode"],
): StudioSelectionContext {
  return selectionContext({
    images: [
      {
        ...IMAGE_BASE,
        assetId: FIRST_ASSET_ID,
        displayOrder: 0,
        failureReason: null,
        originalFilename: "front.jpg",
        replaceRequired: false,
        selected: false,
      },
      {
        ...IMAGE_BASE,
        assetId: SECOND_ASSET_ID,
        displayOrder: 1,
        failureReason: "SERVICE_UNAVAILABLE",
        originalFilename: "side.jpg",
        replaceRequired: false,
        selected: true,
      },
      {
        ...IMAGE_BASE,
        assetId: THIRD_ASSET_ID,
        displayOrder: 2,
        failureReason: "UNUSABLE_IMAGE",
        originalFilename: "rear.jpg",
        replaceRequired: true,
        selected: false,
      },
    ],
    mode,
    options: {
      ...selectionContext().options,
      background: "DARK_STUDIO",
      floor: "PLAIN",
    },
  });
}
