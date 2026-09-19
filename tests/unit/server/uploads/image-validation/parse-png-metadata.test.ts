import { describe, expect, it } from "vitest";

import { parsePngMetadata } from "../../../../../apps/web/src/server/uploads/image-validation/parse-png-metadata";

describe("parsePngMetadata", () => {
  it("reads dimensions only from a valid PNG IHDR header", () => {
    const bytes = new Uint8Array(24);
    const view = new DataView(bytes.buffer);
    view.setUint32(0, 0x89504e47);
    view.setUint32(4, 0x0d0a1a0a);
    view.setUint32(12, 0x49484452);
    view.setUint32(16, 1920);
    view.setUint32(20, 1080);

    expect(parsePngMetadata(bytes)).toEqual({
      mimeType: "image/png",
      width: 1920,
      height: 1080,
    });
    expect(parsePngMetadata(new Uint8Array(24))).toBeNull();
  });
});
