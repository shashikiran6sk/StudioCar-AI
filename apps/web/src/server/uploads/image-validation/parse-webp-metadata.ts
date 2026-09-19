import type { ImageMetadata } from "./image-metadata.types";

const RIFF = 0x52494646;
const WEBP = 0x57454250;
const VP8_LOSSY = 0x56503820;
const VP8_LOSSLESS = 0x5650384c;
const VP8_EXTENDED = 0x56503858;
const WEBP_CHUNK_HEADER_BYTES = 8;

export function parseWebpMetadata(bytes: Uint8Array): ImageMetadata | null {
  if (bytes.byteLength < 20) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0) !== RIFF || view.getUint32(8) !== WEBP) return null;

  let offset = 12;
  while (offset + WEBP_CHUNK_HEADER_BYTES <= bytes.byteLength) {
    const chunkType = view.getUint32(offset);
    const chunkLength = view.getUint32(offset + 4, true);
    const dataOffset = offset + WEBP_CHUNK_HEADER_BYTES;
    if (dataOffset + chunkLength > bytes.byteLength) return null;

    if (chunkType === VP8_EXTENDED && chunkLength >= 10) {
      const width =
        1 +
        view.getUint8(dataOffset + 4) +
        (view.getUint8(dataOffset + 5) << 8) +
        (view.getUint8(dataOffset + 6) << 16);
      const height =
        1 +
        view.getUint8(dataOffset + 7) +
        (view.getUint8(dataOffset + 8) << 8) +
        (view.getUint8(dataOffset + 9) << 16);
      return { mimeType: "image/webp", width, height };
    }

    if (chunkType === VP8_LOSSLESS && chunkLength >= 5) {
      if (view.getUint8(dataOffset) !== 0x2f) return null;
      const bits = view.getUint32(dataOffset + 1, true);
      const width = 1 + (bits & 0x3fff);
      const height = 1 + ((bits >> 14) & 0x3fff);
      return { mimeType: "image/webp", width, height };
    }

    if (chunkType === VP8_LOSSY && chunkLength >= 10) {
      if (
        view.getUint8(dataOffset + 3) !== 0x9d ||
        view.getUint8(dataOffset + 4) !== 0x01 ||
        view.getUint8(dataOffset + 5) !== 0x2a
      ) {
        return null;
      }
      const width = view.getUint16(dataOffset + 6, true) & 0x3fff;
      const height = view.getUint16(dataOffset + 8, true) & 0x3fff;
      return width > 0 && height > 0
        ? { mimeType: "image/webp", width, height }
        : null;
    }

    offset = dataOffset + chunkLength + (chunkLength % 2);
  }

  return null;
}
