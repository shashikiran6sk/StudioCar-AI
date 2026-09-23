import { describe, expect, it } from "vitest";

import { ProcessingOptionsSchema } from "../../../../../packages/contracts/src/processing";
import { toProcessingOptionsJson } from "../../../../../apps/web/src/server/db/repositories/to-processing-options-json";

describe("toProcessingOptionsJson", () => {
  it("persists normalized processing values without UI labels", () => {
    expect(
      toProcessingOptionsJson(
        ProcessingOptionsSchema.parse({
          backgroundId: "PREMIUM_WHITE",
          floorId: "WHITE_STUDIO",
        }),
      ),
    ).toEqual({
      backgroundId: "PREMIUM_WHITE",
      crop: "MAINTAIN_COMPOSITION",
      enhancement: true,
      floorId: "WHITE_STUDIO",
      outputFormat: "JPEG",
      paddingPercent: 8,
      platePrivacy: true,
      quality: 90,
      shadow: "NATURAL",
    });
  });

  // Regression: the floor was once dropped here, so the worker re-read every
  // stored job as a standard floor and no turntable was ever drawn.
  it.each([
    ["DARK_STUDIO", "DARK_TURNTABLE"],
    ["PREMIUM_WHITE", "WHITE_TURNTABLE"],
    ["GREY_STUDIO", "GREY_TURNTABLE"],
    ["DARK_STUDIO", "DARK_STUDIO_FLOOR"],
  ])("stores %s with %s so the worker reads the same floor back", (backgroundId, floorId) => {
    const options = ProcessingOptionsSchema.parse({ backgroundId, floorId });

    const stored = ProcessingOptionsSchema.parse(toProcessingOptionsJson(options));

    expect(stored).toEqual(options);
    expect(stored).toMatchObject({ backgroundId, floorId });
  });
});
