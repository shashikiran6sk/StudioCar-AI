import type { ImageMetadata } from "./image-metadata.types";

const PNG_HEADER_LENGTH = 24;
const PNG_SIGNATURE_HIGH = 0x89504e47;
const PNG_SIGNATURE_LOW = 0x0d0a1a0a;
const IHDR_CHUNK = 0x49484452;

export function parsePngMetadata(bytes: Uint8Array): ImageMetadata | null {
  if (bytes.byteLength < PNG_HEADER_LENGTH) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  if (
    view.getUint32(0) !== PNG_SIGNATURE_HIGH ||
    view.getUint32(4) !== PNG_SIGNATURE_LOW ||
    view.getUint32(12) !== IHDR_CHUNK
  ) {
    return null;
  }

  const width = view.getUint32(16);
  const height = view.getUint32(20);
  return width > 0 && height > 0
    ? { mimeType: "image/png", width, height }
    : null;
}
