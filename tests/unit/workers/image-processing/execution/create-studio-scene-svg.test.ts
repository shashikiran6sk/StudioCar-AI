import { describe, expect, it } from "vitest";

import { createStudioSceneSvg } from "../../../../../workers/image-processing/src/execution/create-studio-scene-svg";
import { STUDIO_SCENE_PALETTES } from "../../../../../workers/image-processing/src/execution/studio-scene.constants";

const base = {
  canvasWidth: 1000,
  canvasHeight: 600,
  palette: STUDIO_SCENE_PALETTES.PREMIUM_WHITE,
  shadowOpacity: 0.38,
  subject: { left: 200, top: 200, width: 600, height: 300 },
};

describe("createStudioSceneSvg", () => {
  it("puts the horizon above the tyre line, so the car stands on the floor", () => {
    const svg = createStudioSceneSvg(base);

    // Tyre line 500, horizon 30% of the car's height above it: 410.
    expect(svg).toContain('<rect width="1000" height="410" fill="url(#wall)"/>');
    expect(svg).toContain('<rect y="410" width="1000" height="190" fill="url(#floor)"/>');
  });

  it("omits the shadow when none is requested", () => {
    expect(
      createStudioSceneSvg({ ...base, shadowOpacity: null }),
    ).not.toContain("fill-opacity");
    expect(createStudioSceneSvg(base)).toContain(
      'fill-opacity="0.38"',
    );
  });

  it("keeps the horizon on the canvas for a car at the very top", () => {
    const svg = createStudioSceneSvg({
      ...base,
      subject: { left: 0, top: 0, width: 400, height: 50 },
    });

    // Tyre line 50, horizon 30% of 50 above it: 35.
    expect(svg).toContain('<rect width="1000" height="35" fill="url(#wall)"/>');
    expect(svg).not.toMatch(/height="-/);
  });
});
