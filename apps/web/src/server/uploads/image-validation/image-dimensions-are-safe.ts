import type { ImageMetadata } from "./image-metadata.types";

export function imageDimensionsAreSafe(
  metadata: ImageMetadata,
  maximumDimension: number,
  maximumPixels: number,
): boolean {
  return (
    metadata.width <= maximumDimension &&
    metadata.height <= maximumDimension &&
    metadata.width * metadata.height <= maximumPixels
  );
}
