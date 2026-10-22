import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { refinePlateQuadrilateral } from "../../../../../workers/image-processing/src/plate-branding/refine-plate-quadrilateral";
import { createPlatePhoto, PHOTO_CORNERS, PHOTO_PLATE } from "../test-support/create-plate-photo";

describe("physical plate surface refinement", () => {
  it.each(["white", "yellow", "green"] satisfies readonly ("white" | "yellow" | "green")[])("recovers the perspective of a %s plate without following character holes", (color) => {
    const corners = refinePlateQuadrilateral(createPlatePhoto(color), PHOTO_PLATE);
    expect(corners).not.toBeNull();
    if (!corners) throw new Error("Expected plate surface.");
    for (const name of ["topLeft", "topRight", "bottomRight", "bottomLeft"] satisfies readonly (keyof typeof PHOTO_CORNERS)[]) {
      expect(Math.abs(corners[name].x - PHOTO_CORNERS[name].x)).toBeLessThanOrEqual(3);
      expect(Math.abs(corners[name].y - PHOTO_CORNERS[name].y)).toBeLessThanOrEqual(3);
    }
  });
  it("skips absent, dark, heavily obscured and body-connected surfaces", () => {
    const image = createPlatePhoto();
    expect(refinePlateQuadrilateral({ ...image, data: Buffer.alloc(image.data.length, 70) }, PHOTO_PLATE)).toBeNull();
    expect(refinePlateQuadrilateral({ ...image, data: Buffer.alloc(image.data.length, 240) }, PHOTO_PLATE)).toBeNull();
    for (let y = 195; y < image.height; y++) image.data.fill(70, y * image.width * 3, (y + 1) * image.width * 3);
    expect(refinePlateQuadrilateral(image, PHOTO_PLATE)).toBeNull();
  });
  it("refines the real-photo detector box to the visible plate", async () => {
    const bytes = await readFile(path.resolve(process.cwd(), "../../tests/fixtures/plate-branding/vehicle-with-plate.png"));
    const { data, info } = await sharp(bytes).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const corners = refinePlateQuadrilateral({ channels: 3, data, height: info.height, width: info.width }, {
      left: 306.52 / info.width, top: 189.55 / info.height, width: 82.57 / info.width, height: 21.66 / info.height, score: 0.12,
    });
    expect(corners).not.toBeNull();
    expect(corners?.topLeft.x).toBeGreaterThan(300);
    expect(corners?.bottomRight.x).toBeLessThan(395);
  });
});
