import { describe, expect, it } from "vitest";

import { createContactShadowSvg } from "../../../../../workers/image-processing/src/studio-scene/create-contact-shadow-svg";

describe("createContactShadowSvg", () => {
  it("draws one soft ellipse over the whole frame", () => {
    const svg = createContactShadowSvg(
      { width: 800, height: 450 },
      { cx: 400, cy: 380, rx: 180, ry: 9 },
      0.42,
    );

    expect(svg).toContain('width="800" height="450"');
    expect(svg).toContain('<ellipse cx="400" cy="380" rx="180" ry="9"');
    expect(svg).toContain('fill-opacity="0.42"');
    expect(svg).toContain("feGaussianBlur");
  });
});
