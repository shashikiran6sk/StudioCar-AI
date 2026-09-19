import { describe, expect, it } from "vitest";

import { parseWebpMetadata } from "../../../../../apps/web/src/server/uploads/image-validation/parse-webp-metadata";

describe("parseWebpMetadata", () => {
  it("reads dimensions from an extended WebP header", () => {
    const bytes = new Uint8Array(30);
    const view = new DataView(bytes.buffer);
    view.setUint32(0, 0x52494646);
    view.setUint32(4, 22, true);
    view.setUint32(8, 0x57454250);
    view.setUint32(12, 0x56503858);
    view.setUint32(16, 10, true);
    view.setUint8(24, 127);
    view.setUint8(27, 63);

    expect(parseWebpMetadata(bytes)).toEqual({
      mimeType: "image/webp",
      width: 128,
      height: 64,
    });
    expect(parseWebpMetadata(new Uint8Array(30))).toBeNull();
  });
});
