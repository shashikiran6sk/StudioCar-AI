import { describe, expect, it } from "vitest";

import { selectStudioFloor } from "../../../../apps/web/src/features/studio-treatment/select-studio-floor";

describe("selectStudioFloor", () => {
  it("chooses a floor that belongs to the current background", () => {
    expect(
      selectStudioFloor({ backgroundId: "PREMIUM_WHITE", floorId: "WHITE_STUDIO" }, "WHITE_TURNTABLE"),
    ).toEqual({ backgroundId: "PREMIUM_WHITE", floorId: "WHITE_TURNTABLE" });
  });

  it("refuses another background's floor and keeps the current choice", () => {
    const current = { backgroundId: "PREMIUM_WHITE", floorId: "WHITE_STUDIO" } satisfies Parameters<typeof selectStudioFloor>[0];

    expect(selectStudioFloor(current, "DARK_TURNTABLE")).toBe(current);
  });
});
