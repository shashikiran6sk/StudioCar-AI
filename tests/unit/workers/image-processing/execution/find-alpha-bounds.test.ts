import { describe, expect, it } from "vitest";
import { findAlphaBounds } from "../../../../../workers/image-processing/src/execution/find-alpha-bounds";

describe("findAlphaBounds", () => {
  it("ignores faint residue and finds opaque bounds", () => {
    const pixels = new Uint8Array(100).fill(20);
    pixels[32] = 255;
    pixels[65] = 255;
    expect(findAlphaBounds(pixels, 10, 10)).toEqual({
      left: 2,
      top: 3,
      width: 4,
      height: 4,
    });
  });
  it("rejects empty or mismatched masks", () => {
    expect(findAlphaBounds(new Uint8Array(100), 10, 10)).toBeNull();
    expect(findAlphaBounds(new Uint8Array(10), 10, 10)).toBeNull();
  });
});
