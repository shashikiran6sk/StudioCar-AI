import type { SupportedImageMimeType } from "@studiocar/contracts";

const IMAGE_EXTENSION_BY_MIME: Record<SupportedImageMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function buildOriginalObjectKey(
  userId: string,
  vehicleId: string,
  assetId: string,
  mimeType: SupportedImageMimeType,
): string {
  const extension = IMAGE_EXTENSION_BY_MIME[mimeType];
  return `users/${userId}/vehicles/${vehicleId}/assets/${assetId}/original/source.${extension}`;
}
