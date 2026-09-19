import { parseJpegMetadata } from "./parse-jpeg-metadata";
import { parsePngMetadata } from "./parse-png-metadata";
import { parseWebpMetadata } from "./parse-webp-metadata";
import type { ImageMetadata } from "./image-metadata.types";

export function parseImageMetadata(bytes: Uint8Array): ImageMetadata | null {
  return (
    parsePngMetadata(bytes) ??
    parseJpegMetadata(bytes) ??
    parseWebpMetadata(bytes)
  );
}
