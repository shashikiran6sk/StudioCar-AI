import { describe, expect, it } from "vitest";

import { parseImageMetadata } from "../../../../../apps/web/src/server/uploads/image-validation/parse-image-metadata";

describe("parseImageMetadata", () => {
  it("detects supported magic bytes without trusting a filename", () => {
    const png = new Uint8Array(24);
    const view = new DataView(png.buffer);
    view.setUint32(0, 0x89504e47);
    view.setUint32(4, 0x0d0a1a0a);
    view.setUint32(12, 0x49484452);
    view.setUint32(16, 20);
    view.setUint32(20, 10);

    expect(parseImageMetadata(png)?.mimeType).toBe("image/png");
    expect(parseImageMetadata(new Uint8Array([1, 2, 3]))).toBeNull();
  });
});
