import {
  SupportedImageMimeTypeSchema,
  type CommitUploadResponse,
} from "@studiocar/contracts";

import type { UploadAsset } from "./upload.types";

export function toCommitUploadResponse(
  asset: UploadAsset,
): CommitUploadResponse | null {
  const mimeType = SupportedImageMimeTypeSchema.safeParse(asset.mimeType);
  if (
    asset.status !== "UPLOADED" ||
    !mimeType.success ||
    asset.width === null ||
    asset.height === null
  ) {
    return null;
  }

  return {
    assetId: asset.id,
    status: "UPLOADED",
    mimeType: mimeType.data,
    sizeBytes: Number(asset.sizeBytes),
    width: asset.width,
    height: asset.height,
  };
}
