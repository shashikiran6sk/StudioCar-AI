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
});
