import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { refinePlateQuadrilateral } from "../../../../../workers/image-processing/src/plate-branding/refine-plate-quadrilateral";
import { createPlatePhoto, PHOTO_CORNERS, PHOTO_PLATE } from "../test-support/create-plate-photo";
import { createTiltedPlatePhoto } from "../test-support/create-tilted-plate-photo";
import { PLATE_STANDARD_SURFACE_FIT_PASSES } from "../../../../../workers/image-processing/src/plate-branding/plate-branding.constants";

describe("physical plate surface refinement", () => {
  it.each(["left", "right"] satisfies readonly ("left" | "right")[])("recovers a complete steep %s-facing plate after standard coverage fails", (direction) => {
    const { image, detection, corners: expected } = createTiltedPlatePhoto(direction, true, 50);
    expect(refinePlateQuadrilateral(image, detection, PLATE_STANDARD_SURFACE_FIT_PASSES)).toBeNull();
    const corners = refinePlateQuadrilateral(image, detection);
    expect(corners).not.toBeNull();
    if (!corners) throw new Error("Expected steep plate outline.");
    for (const name of ["topLeft", "topRight", "bottomRight", "bottomLeft"] satisfies readonly (keyof typeof expected)[]) {
      expect(Math.abs(corners[name].x - expected[name].x)).toBeLessThanOrEqual(2);
      expect(Math.abs(corners[name].y - expected[name].y)).toBeLessThanOrEqual(2);
    }
  });
  it.each(["left", "right"] satisfies readonly ("left" | "right")[])("recovers a complete %s-facing tilted plate with a smaller rectangular coverage share", (direction) => {
    const { image, detection, corners: expected } = createTiltedPlatePhoto(direction);
    for (const score of [0.12, 0.15]) {
      const corners = refinePlateQuadrilateral(image, { ...detection, score });
      expect(corners).not.toBeNull();
      if (!corners) throw new Error("Expected complete tilted surface.");
      for (const name of ["topLeft", "topRight", "bottomRight", "bottomLeft"] satisfies readonly (keyof typeof expected)[]) {
        expect(Math.abs(corners[name].x - expected[name].x)).toBeLessThanOrEqual(2);
        expect(Math.abs(corners[name].y - expected[name].y)).toBeLessThanOrEqual(2);
      }
    }
  });
  it("does not apply tilted coverage to an equally sized flat partial surface", () => {
    const { image, detection } = createTiltedPlatePhoto("right", false);
    expect(refinePlateQuadrilateral(image, detection)).toBeNull();
  });
  it("keeps multiple reliable connected surfaces ambiguous without a fallback", () => {
    const image = createPlatePhoto();
    image.data.fill(70);
    const rectangles = [
      { left: 167, top: 162, width: 166, height: 66, rgb: [240, 240, 240] },
      { left: 188, top: 174, width: 124, height: 44, rgb: [70, 70, 70] },
      { left: 190, top: 176, width: 120, height: 40, rgb: [240, 205, 20] },
    ];
    for (const rectangle of rectangles) for (let y = rectangle.top; y < rectangle.top + rectangle.height; y++) {
      for (let x = rectangle.left; x < rectangle.left + rectangle.width; x++) {
        rectangle.rgb.forEach((value, channel) => { image.data[(y * image.width + x) * 3 + channel] = value; });
      }
    }
    expect(refinePlateQuadrilateral(image, PHOTO_PLATE)).toBeNull();
  });
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
  it.each([135, 150, 180])("retains the plate edges across a neutral shadow at intensity %s", (intensity) => {
    const image = createPlatePhoto();
    // The stripe spans the plate, splitting the bright surface into pieces
    // that are individually too small. Dark registration strokes stay dark.
    for (let y = 0; y < image.height; y++) for (let x = 225; x <= 246; x++) {
      const offset = (y * image.width + x) * 3;
      if (image.data[offset] === 240) image.data.fill(intensity, offset, offset + 3);
    }
    const corners = refinePlateQuadrilateral(image, PHOTO_PLATE);
    expect(corners).not.toBeNull();
    if (!corners) throw new Error("Expected shaded plate surface.");
    for (const name of ["topLeft", "topRight", "bottomRight", "bottomLeft"] satisfies readonly (keyof typeof PHOTO_CORNERS)[]) {
      expect(Math.abs(corners[name].x - PHOTO_CORNERS[name].x)).toBeLessThanOrEqual(3);
      expect(Math.abs(corners[name].y - PHOTO_CORNERS[name].y)).toBeLessThanOrEqual(3);
    }
  });
  it("rejects a gray surface with only a small bright patch", () => {
    const image = createPlatePhoto();
    for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
      const offset = (y * image.width + x) * 3;
      if (image.data[offset] === 240 && x > 195) image.data.fill(150, offset, offset + 3);
    }
    expect(refinePlateQuadrilateral(image, PHOTO_PLATE)).toBeNull();
  });
  it("fits a shaded cool-white plate while retaining its perspective", () => {
    const image = createPlatePhoto();
    for (let offset = 0; offset < image.data.length; offset += 3) {
      if (image.data[offset] !== 240) continue;
      image.data[offset] = 160;
      image.data[offset + 1] = 185;
      image.data[offset + 2] = 205;
    }
    const corners = refinePlateQuadrilateral(image, PHOTO_PLATE);
    expect(corners).not.toBeNull();
    expect(corners?.topLeft.x).toBeCloseTo(PHOTO_CORNERS.topLeft.x, 0);
    expect(corners?.bottomRight.y).toBeCloseTo(PHOTO_CORNERS.bottomRight.y, 0);
  });
  it("stops growing before a shaded plate joins the surrounding gray body", () => {
    const image = createPlatePhoto();
    for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
      const offset = (y * image.width + x) * 3;
      if (image.data[offset] === 70) image.data.fill(160, offset, offset + 3);
      else if (image.data[offset] === 240 && x >= 225 && x <= 246) image.data.fill(180, offset, offset + 3);
    }
    const corners = refinePlateQuadrilateral(image, PHOTO_PLATE);
    expect(corners).not.toBeNull();
    expect(corners?.topLeft.x).toBeCloseTo(PHOTO_CORNERS.topLeft.x, 0);
    expect(corners?.bottomRight.y).toBeCloseTo(PHOTO_CORNERS.bottomRight.y, 0);
  });
  it("requires a stronger model ranking to recover a deeply shaded white surface", () => {
    const image = createPlatePhoto();
    for (let offset = 0; offset < image.data.length; offset += 3) {
      if (image.data[offset] === 240) image.data.fill(145, offset, offset + 3);
    }
    expect(refinePlateQuadrilateral(image, PHOTO_PLATE)).toBeNull();
    const corners = refinePlateQuadrilateral(image, { ...PHOTO_PLATE, score: 0.14 });
    expect(corners).not.toBeNull();
    expect(corners?.topLeft.x).toBeCloseTo(PHOTO_CORNERS.topLeft.x, 0);
    expect(corners?.bottomRight.y).toBeCloseTo(PHOTO_CORNERS.bottomRight.y, 0);
  });
  it("recovers the full plate instead of accepting only a bright lower strip", () => {
    const image = createPlatePhoto();
    for (let y = 0; y < 186; y++) for (let x = 0; x < image.width; x++) {
      const offset = (y * image.width + x) * 3;
      if (image.data[offset] === 240) image.data.fill(145, offset, offset + 3);
    }
    const corners = refinePlateQuadrilateral(image, PHOTO_PLATE);
    expect(corners).not.toBeNull();
    if (!corners) throw new Error("Expected complete plate surface.");
    expect(Math.abs(corners.topRight.y - PHOTO_CORNERS.topRight.y)).toBeLessThanOrEqual(3);
    expect(Math.abs(corners.topLeft.y - PHOTO_CORNERS.topLeft.y)).toBeLessThanOrEqual(3);
  });
  it("connects a narrow deeper shadow only for a strongly ranked plate", () => {
    const image = createPlatePhoto();
    for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
      const offset = (y * image.width + x) * 3;
      if (image.data[offset] === 240) image.data.fill(x >= 225 && x <= 246 ? 125 : 145, offset, offset + 3);
    }
    expect(refinePlateQuadrilateral(image, PHOTO_PLATE)).toBeNull();
    expect(refinePlateQuadrilateral(image, { ...PHOTO_PLATE, score: 0.14 })).not.toBeNull();
  });
  it("keeps a strong ranking from overriding missing, obscured, transparent or body-connected surface checks", async () => {
    const detection = { ...PHOTO_PLATE, score: 0.15 };
    const image = createPlatePhoto();
    for (const intensity of [70, 145, 240]) {
      expect(refinePlateQuadrilateral({ ...image, data: Buffer.alloc(image.data.length, intensity) }, detection)).toBeNull();
    }
    const transparent = await sharp(image.data, { raw: { channels: 3, height: image.height, width: image.width } })
      .ensureAlpha(0).raw().toBuffer();
    expect(refinePlateQuadrilateral({ ...image, channels: 4, data: transparent }, detection)).toBeNull();
    for (let y = 195; y < image.height; y++) image.data.fill(70, y * image.width * 3, (y + 1) * image.width * 3);
    expect(refinePlateQuadrilateral(image, detection)).toBeNull();
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
