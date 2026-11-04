import { describe, expect, it } from "vitest";

import { findVisiblePlateSurface } from "../../../../../workers/image-processing/src/plate-branding/find-visible-plate-surface";
import { createPlatePhoto, PHOTO_PLATE, PHOTO_WIDTH } from "../test-support/create-plate-photo";
import { createTiltedPlatePhoto } from "../test-support/create-tilted-plate-photo";
import { createPlatePair } from "../test-support/create-plate-pair";
import { refinePlateQuadrilateral } from "../../../../../workers/image-processing/src/plate-branding/refine-plate-quadrilateral";
import { PLATE_STANDARD_SURFACE_FIT_PASSES } from "../../../../../workers/image-processing/src/plate-branding/plate-branding.constants";
import { createShadedPlatePhoto } from "../test-support/create-shaded-plate-photo";

const BADGE = { left: 0.1, top: 0.2, width: 0.08, height: 0.04, score: 0.115 };

describe("visible plate surface selection", () => {
  it("skips a weak compact door-label detection while retaining stronger compact plates", () => {
    const image = createPlatePhoto();
    image.data.fill(70);
    for (let y = 150; y <= 220; y++) for (let x = 200; x <= 300; x++) {
      const offset = (y * image.width + x) * 3;
      image.data.fill(240, offset, offset + 3);
    }
    const label = { left: 194 / image.width, top: 144 / image.height, width: 112 / image.width, height: 82 / image.height, score: 0.084 };
    expect(refinePlateQuadrilateral(image, label)).not.toBeNull();
    expect(findVisiblePlateSurface(image, [label])).toBeNull();
    expect(findVisiblePlateSurface(image, [{ ...label, score: 0.14 }])).not.toBeNull();
    expect(findVisiblePlateSurface(createPlatePhoto(), [{ ...PHOTO_PLATE, score: 0.09 }])).not.toBeNull();
    const pair = createPlatePair({ image: createPlatePhoto(), detection: { ...PHOTO_PLATE, score: 0.095 } }, { image, detection: label });
    expect(findVisiblePlateSurface(pair.image, [pair.first, pair.second]))
      .toEqual(findVisiblePlateSurface(pair.image, [pair.first]));
  });

  it("recovers shaded primaries while retaining ambiguity and never promoting a background plate", () => {
    const first = { image: createShadedPlatePhoto(), detection: { ...PHOTO_PLATE, score: 0.14 } };
    const second = { image: createShadedPlatePhoto(), detection: { ...PHOTO_PLATE, score: 0.13 } };
    const pair = createPlatePair(first, second);
    expect(findVisiblePlateSurface(pair.image, [pair.first])).not.toBeNull();
    expect(findVisiblePlateSurface(pair.image, [pair.second])).not.toBeNull();
    expect(findVisiblePlateSurface(pair.image, [pair.first, pair.second])).toBeNull();
    expect(findVisiblePlateSurface(first.image, [first.detection, { ...BADGE, score: 0.15 }])).toBeNull();
  });
  it("retains an existing success when only a secondary surface needs projected coverage", () => {
    const secondary = createTiltedPlatePhoto("right", true, 50);
    const pair = createPlatePair({ image: createPlatePhoto(), detection: PHOTO_PLATE },
      { image: secondary.image, detection: { ...secondary.detection, score: 0.115 } });
    expect(refinePlateQuadrilateral(pair.image, pair.second, PLATE_STANDARD_SURFACE_FIT_PASSES)).toBeNull();
    expect(refinePlateQuadrilateral(pair.image, pair.second)).not.toBeNull();
    expect(findVisiblePlateSurface(pair.image, [pair.first, pair.second]))
      .toEqual(refinePlateQuadrilateral(pair.image, pair.first, PLATE_STANDARD_SURFACE_FIT_PASSES));
    expect(findVisiblePlateSurface(pair.image, [pair.first, pair.second])).not.toBeNull();
  });
  it("retains ambiguity when both competing plates need projected coverage", () => {
    const first = createTiltedPlatePhoto("right", true, 50);
    const second = createTiltedPlatePhoto("left", true, 50);
    const pair = createPlatePair(first, { image: second.image, detection: { ...second.detection, score: 0.115 } });
    expect(findVisiblePlateSurface(pair.image, [pair.first])).not.toBeNull();
    expect(findVisiblePlateSurface(pair.image, [pair.second])).not.toBeNull();
    expect(findVisiblePlateSurface(pair.image, [pair.first, pair.second])).toBeNull();
  });
  it("rejects a secondary badge surface before treating its close model ranking as ambiguous", () => {
    const image = createPlatePhoto();
    expect(findVisiblePlateSurface(image, [BADGE, PHOTO_PLATE]))
      .toEqual(findVisiblePlateSurface(image, [PHOTO_PLATE]));
    expect(findVisiblePlateSurface(image, [BADGE, PHOTO_PLATE])).not.toBeNull();
  });

  it("does not promote a background plate when the highest-ranked surface is unreliable", () => {
    expect(findVisiblePlateSurface(createPlatePhoto(), [PHOTO_PLATE, { ...BADGE, score: 0.125 }])).toBeNull();
  });

  it("retains ambiguity when a second comparable candidate has a genuine plate surface", () => {
    const image = createPlatePhoto();
    const source = Buffer.from(image.data);
    for (let y = 0; y <= 50; y++) {
      const start = ((170 + y) * PHOTO_WIDTH + 180) * 3;
      source.copy(image.data, ((70 + y) * PHOTO_WIDTH + 30) * 3, start, start + 141 * 3);
    }
    const secondary = { ...PHOTO_PLATE, left: 0.06, top: PHOTO_PLATE.top - 1 / 3, score: 0.115 };
    expect(findVisiblePlateSurface(image, [secondary])).not.toBeNull();
    expect(findVisiblePlateSurface(image, [PHOTO_PLATE, secondary])).toBeNull();
  });

  it("retains duplicate-detection handling", () => {
    const image = createPlatePhoto();
    const duplicate = { ...PHOTO_PLATE, left: PHOTO_PLATE.left + 0.002, score: 0.115 };
    expect(findVisiblePlateSurface(image, [duplicate, PHOTO_PLATE]))
      .toEqual(findVisiblePlateSurface(image, [PHOTO_PLATE]));
  });

  it("fails closed when too many candidates need additional surface fitting", () => {
    const badges = Array.from({ length: 4 }, (_, index) => ({ ...BADGE, left: BADGE.left + index * 0.1 }));
    expect(findVisiblePlateSurface(createPlatePhoto(), [PHOTO_PLATE, ...badges.slice(0, 3)])).not.toBeNull();
    expect(findVisiblePlateSurface(createPlatePhoto(), [PHOTO_PLATE, ...badges])).toBeNull();
  });

  it("keeps absent, undersized and non-plate surfaces ineligible", () => {
    const image = createPlatePhoto();
    expect(findVisiblePlateSurface(image, [])).toBeNull();
    expect(findVisiblePlateSurface(image, [BADGE])).toBeNull();
    const tiny = { ...BADGE, width: 0.01 };
    expect(findVisiblePlateSurface(image, [PHOTO_PLATE, ...Array.from({ length: 8 }, () => tiny)]))
      .toEqual(findVisiblePlateSurface(image, [PHOTO_PLATE]));
  });
});
