import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { selectVisiblePlate } from "../../../../../workers/image-processing/src/plate-branding/select-visible-plate";
import { createPlatePhoto, PHOTO_PLATE } from "../test-support/create-plate-photo";

describe("visible plate selection", () => {
  it("accepts one plausible plate and suppresses overlapping duplicate detections", () => {
    const image = createPlatePhoto();
    expect(selectVisiblePlate(image, [PHOTO_PLATE, { ...PHOTO_PLATE, left: 0.361, score: 0.1 }])).toEqual(PHOTO_PLATE);
  });
  it("skips tiny, weak, vehicle-size, portrait and multiple distinct candidates", () => {
    const image = createPlatePhoto();
    for (const box of [{ ...PHOTO_PLATE, score: 0.02 }, { ...PHOTO_PLATE, width: 0.01 },
      { ...PHOTO_PLATE, width: 0.8, height: 0.8 }, { ...PHOTO_PLATE, width: 0.04 }]) {
      expect(selectVisiblePlate(image, [box])).toBeNull();
    }
    expect(selectVisiblePlate(image, [PHOTO_PLATE, { ...PHOTO_PLATE, left: 0.02 }])).toBeNull();
    expect(selectVisiblePlate(image, [])).toBeNull();
  });
  it("requires opaque vehicle pixels, excluding transparency and provider shadow", async () => {
    const photo = createPlatePhoto();
    const opaque = await sharp(photo.data, { raw: { channels: 3, height: photo.height, width: photo.width } }).ensureAlpha().raw().toBuffer();
    expect(selectVisiblePlate({ ...photo, channels: 4, data: opaque }, [PHOTO_PLATE])).toEqual(PHOTO_PLATE);
    for (let i = 3; i < opaque.length; i += 4) opaque[i] = 80;
    expect(selectVisiblePlate({ ...photo, channels: 4, data: opaque }, [PHOTO_PLATE])).toBeNull();
  });
  it("retains a dominant foreground plate when a much smaller candidate ranks lower", () => {
    const foreground = { ...PHOTO_PLATE, score: 0.14 };
    const background = { ...PHOTO_PLATE, left: 0.02, width: 0.07, height: 0.04, score: 0.09 };
    expect(selectVisiblePlate(createPlatePhoto(), [background, foreground])).toEqual(foreground);
  });
  it("keeps multiple candidates ambiguous when area or score dominance is insufficient", () => {
    const foreground = { ...PHOTO_PLATE, score: 0.14 };
    const background = { ...PHOTO_PLATE, left: 0.02, width: 0.07, height: 0.04, score: 0.13 };
    expect(selectVisiblePlate(createPlatePhoto(), [foreground, background])).toBeNull();
    expect(selectVisiblePlate(createPlatePhoto(), [foreground, { ...PHOTO_PLATE, left: 0.02, score: 0.09 }])).toBeNull();
  });
  it("requires the foreground area to be at least four times every distinct candidate", () => {
    const foreground = { ...PHOTO_PLATE, score: 0.14 };
    const background = { ...PHOTO_PLATE, left: 0.02, width: 0.14, height: 0.085, score: 0.1 };
    expect(selectVisiblePlate(createPlatePhoto(), [foreground, background])).toEqual(foreground);
    expect(selectVisiblePlate(createPlatePhoto(), [foreground, { ...background, width: 0.141 }])).toBeNull();
  });
  it("allows one transparent detector-box corner only with a strong ranking and opaque center", async () => {
    const photo = createPlatePhoto();
    const data = await sharp(photo.data, { raw: { channels: 3, height: photo.height, width: photo.width } }).ensureAlpha().raw().toBuffer();
    const x = Math.floor((PHOTO_PLATE.left + PHOTO_PLATE.width * 0.1) * photo.width);
    const y = Math.floor((PHOTO_PLATE.top + PHOTO_PLATE.height * 0.1) * photo.height);
    data[(y * photo.width + x) * 4 + 3] = 0;
    const strong = { ...PHOTO_PLATE, score: 0.14 };
    expect(selectVisiblePlate({ ...photo, channels: 4, data }, [PHOTO_PLATE])).toBeNull();
    expect(selectVisiblePlate({ ...photo, channels: 4, data }, [strong])).toEqual(strong);
    const oppositeX = Math.floor((PHOTO_PLATE.left + PHOTO_PLATE.width * 0.9) * photo.width);
    const oppositeY = Math.floor((PHOTO_PLATE.top + PHOTO_PLATE.height * 0.9) * photo.height);
    data[(oppositeY * photo.width + oppositeX) * 4 + 3] = 0;
    expect(selectVisiblePlate({ ...photo, channels: 4, data }, [strong])).toBeNull();
    data[(oppositeY * photo.width + oppositeX) * 4 + 3] = 255;
    const centerX = Math.floor((PHOTO_PLATE.left + PHOTO_PLATE.width * 0.5) * photo.width);
    const centerY = Math.floor((PHOTO_PLATE.top + PHOTO_PLATE.height * 0.5) * photo.height);
    data[(centerY * photo.width + centerX) * 4 + 3] = 0;
    expect(selectVisiblePlate({ ...photo, channels: 4, data }, [strong])).toBeNull();
  });
});
