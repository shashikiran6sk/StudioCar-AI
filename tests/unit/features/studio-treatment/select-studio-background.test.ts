import { describe, expect, it } from "vitest";

import type { StudioTreatment } from "../../../../packages/contracts/src/processing";
import { selectStudioBackground } from "../../../../apps/web/src/features/studio-treatment/select-studio-background";

describe("selectStudioBackground", () => {
  it("starts a background on its first floor", () => {
    expect(selectStudioBackground(null, "GREY_STUDIO")).toEqual({
      backgroundId: "GREY_STUDIO",
      floorId: "GREY_STUDIO_FLOOR",
    });
  });

  it("keeps the chosen floor when the same background is picked again", () => {
    const turntable: StudioTreatment = { backgroundId: "DARK_STUDIO", floorId: "DARK_TURNTABLE" };

    expect(selectStudioBackground(turntable, "DARK_STUDIO")).toBe(turntable);
  });

  it("resets a floor that belongs to the previous background", () => {
    expect(
      selectStudioBackground({ backgroundId: "DARK_STUDIO", floorId: "DARK_TURNTABLE" }, "PREMIUM_WHITE"),
    ).toEqual({ backgroundId: "PREMIUM_WHITE", floorId: "WHITE_STUDIO" });
  });
});
