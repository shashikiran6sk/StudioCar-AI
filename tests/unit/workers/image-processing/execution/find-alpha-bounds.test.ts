import { describe, expect, it } from "vitest";

import { findAlphaBounds } from "../../../../../workers/image-processing/src/execution/find-alpha-bounds";

describe("findAlphaBounds", () => {
  it("finds the bounds and count of pixels at or above the threshold", () => {
    const alpha = new Uint8Array(100).fill(20);
    alpha[32] = 255;
    alpha[65] = 128;
    expect(findAlphaBounds(alpha, 10, 10, 128)).toEqual({
      box: { left: 2, top: 3, width: 4, height: 4 },
      pixelCount: 2,
    });
  });

  it("includes faint pixels when the threshold is low", () => {
    const alpha = new Uint8Array(100).fill(20);
    expect(findAlphaBounds(alpha, 10, 10, 8)).toEqual({
      box: { left: 0, top: 0, width: 10, height: 10 },
      pixelCount: 100,
    });
  });

  it("rejects empty or mismatched masks", () => {
    expect(findAlphaBounds(new Uint8Array(100), 10, 10, 1)).toBeNull();
    expect(findAlphaBounds(new Uint8Array(10), 10, 10, 1)).toBeNull();
    expect(findAlphaBounds(new Uint8Array(0), 0, 0, 1)).toBeNull();
  });
});
