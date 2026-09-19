import type { ImageMetadata } from "./image-metadata.types";

const JPEG_START_OF_IMAGE = 0xffd8;
const JPEG_MARKER_PREFIX = 0xff;
const JPEG_START_OF_SCAN = 0xda;
const JPEG_END_OF_IMAGE = 0xd9;
const MINIMUM_FRAME_SEGMENT_LENGTH = 7;
const START_OF_FRAME_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce,
  0xcf,
]);

export function parseJpegMetadata(bytes: Uint8Array): ImageMetadata | null {
  if (bytes.byteLength < 4) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint16(0) !== JPEG_START_OF_IMAGE) return null;

  let offset = 2;
  while (offset + 3 < bytes.byteLength) {
    if (view.getUint8(offset) !== JPEG_MARKER_PREFIX) return null;
    while (
      offset < bytes.byteLength &&
      view.getUint8(offset) === JPEG_MARKER_PREFIX
    ) {
      offset += 1;
    }
    if (offset >= bytes.byteLength) return null;

    const marker = view.getUint8(offset);
    offset += 1;
    if (marker === JPEG_END_OF_IMAGE || marker === JPEG_START_OF_SCAN) {
      return null;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) continue;
    if (offset + 1 >= bytes.byteLength) return null;

    const segmentLength = view.getUint16(offset);
    if (segmentLength < 2 || offset + segmentLength > bytes.byteLength) {
      return null;
    }

    if (START_OF_FRAME_MARKERS.has(marker)) {
      if (segmentLength < MINIMUM_FRAME_SEGMENT_LENGTH) return null;
      const height = view.getUint16(offset + 3);
      const width = view.getUint16(offset + 5);
      return width > 0 && height > 0
        ? { mimeType: "image/jpeg", width, height }
        : null;
    }
    offset += segmentLength;
  }

  return null;
}
