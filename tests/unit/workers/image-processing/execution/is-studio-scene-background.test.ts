import { describe, expect, it } from "vitest";

import { isStudioSceneBackground } from "../../../../../workers/image-processing/src/execution/is-studio-scene-background";

describe("isStudioSceneBackground", () => {
  it("draws a studio for the three studio backgrounds", () => {
    for (const background of ["PREMIUM_WHITE", "GREY_STUDIO", "DARK_STUDIO"] as const) {
      expect(isStudioSceneBackground(background)).toBe(true);
    }
  });

  it("leaves the original background alone", () => {
    expect(isStudioSceneBackground("ORIGINAL")).toBe(false);
  });
});
