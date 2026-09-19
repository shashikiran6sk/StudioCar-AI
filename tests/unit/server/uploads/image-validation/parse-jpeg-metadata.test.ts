import { describe, expect, it } from "vitest";

import { parseJpegMetadata } from "../../../../../apps/web/src/server/uploads/image-validation/parse-jpeg-metadata";

describe("parseJpegMetadata", () => {
  it("reads dimensions from a supported start-of-frame segment", () => {
    const bytes = new Uint8Array(21);
    const view = new DataView(bytes.buffer);
    view.setUint16(0, 0xffd8);
    view.setUint16(2, 0xffc0);
    view.setUint16(4, 17);
    view.setUint8(6, 8);
    view.setUint16(7, 1080);
    view.setUint16(9, 1920);

    expect(parseJpegMetadata(bytes)).toEqual({
      mimeType: "image/jpeg",
      width: 1920,
      height: 1080,
    });
    expect(parseJpegMetadata(new Uint8Array([0xff, 0xd8, 0xff, 0xda]))).toBeNull();
  });
});
