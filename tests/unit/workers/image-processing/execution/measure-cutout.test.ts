import { describe, expect, it } from "vitest";

import { measureCutout } from "../../../../../workers/image-processing/src/execution/measure-cutout";
import { createCutout, DEFAULT_CUTOUT } from "../test-support/create-cutout";

describe("measureCutout", () => {
  it("measures the vehicle body without its shadow, and the content with it", () => {
    const { body, shadow } = DEFAULT_CUTOUT;
    expect(measureCutout(createCutout())).toEqual({
      content: {
        height: body.height + shadow.depth,
        left: body.left - shadow.overhang,
        top: body.top,
        width: body.width + shadow.overhang * 2,
      },
      vehicle: body,
      vehicleCoverage: (body.width * body.height) / (640 * 400),
    });
  });

  it("finds no vehicle in a shadow alone", () => {
    expect(
      measureCutout(
        createCutout({
          ...DEFAULT_CUTOUT,
          body: { height: 0, left: 100, top: 120, width: 0 },
        }),
      ),
    ).toBeNull();
  });

  it("finds no vehicle in a fully transparent frame", () => {
    const empty = { channels: 4 as const, data: Buffer.alloc(40 * 30 * 4), height: 30, width: 40 };
    expect(measureCutout(empty)).toBeNull();
  });

  it("treats a speck of opaque residue as no vehicle", () => {
    expect(
      measureCutout(
        createCutout({
          ...DEFAULT_CUTOUT,
          body: { height: 2, left: 10, top: 10, width: 2 },
        }),
      ),
    ).toBeNull();
  });
});
