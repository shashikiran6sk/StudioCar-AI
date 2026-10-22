import { expect, it } from "vitest";
import { validatePlateQuadrilateral } from "../../../../../workers/image-processing/src/plate-branding/validate-plate-quadrilateral";
import { PHOTO_CORNERS } from "../test-support/create-plate-photo";

it("rejects clipping, self-intersection, oversized and non-finite overlay geometry", () => {
  expect(validatePlateQuadrilateral(PHOTO_CORNERS, 500, 300)).toBe(true);
  expect(validatePlateQuadrilateral(PHOTO_CORNERS, 300, 200)).toBe(false);
  expect(validatePlateQuadrilateral({ ...PHOTO_CORNERS, topRight: PHOTO_CORNERS.bottomLeft }, 500, 300)).toBe(false);
  expect(validatePlateQuadrilateral({ ...PHOTO_CORNERS, topLeft: { x: NaN, y: 0 } }, 500, 300)).toBe(false);
  expect(validatePlateQuadrilateral({ topLeft: { x: 0, y: 0 }, topRight: { x: 2000, y: 0 }, bottomRight: { x: 2000, y: 1000 }, bottomLeft: { x: 0, y: 1000 } }, 3000, 2000)).toBe(false);
});
