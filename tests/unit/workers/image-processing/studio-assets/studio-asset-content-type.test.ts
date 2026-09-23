import { describe, expect, it } from "vitest";

import { studioAssetContentType } from "../../../../../workers/image-processing/src/studio-assets/studio-asset-content-type";

describe("studioAssetContentType", () => {
  it("stores WebP and PNG assets with their media types", () => {
    expect(studioAssetContentType("studio-assets/v1/backgrounds/bg-dark-studio.webp")).toBe("image/webp");
    expect(studioAssetContentType("studio-assets/v1/floors/floor-dark-turntable.png")).toBe("image/png");
  });

  it("refuses any other file", () => {
    expect(() => studioAssetContentType("studio-assets/v1/floors/notes.txt")).toThrow();
  });
});
