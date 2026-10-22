import type { RawImage } from "../../../../../workers/image-processing/src/execution/vehicle-alpha.types";
import type { PlateQuadrilateral } from "../../../../../workers/image-processing/src/plate-branding/plate-branding.types";

export const PHOTO_WIDTH = 500;
export const PHOTO_HEIGHT = 300;
export const PHOTO_PLATE = { height: 0.17, left: 0.36, score: 0.12, top: 0.56, width: 0.28 };
export const PHOTO_CORNERS: PlateQuadrilateral = {
  topLeft: { x: 180, y: 180 }, topRight: { x: 320, y: 170 },
  bottomRight: { x: 310, y: 215 }, bottomLeft: { x: 182, y: 220 },
};

/** An angled plate with dark character strokes, distinct from the body. */
export function createPlatePhoto(color: "white" | "yellow" | "green" = "white"): RawImage {
  const data = Buffer.alloc(PHOTO_WIDTH * PHOTO_HEIGHT * 3, 70);
  for (let y = 170; y <= 220; y++) for (let x = 180; x <= 320; x++) {
    const upper = 180 - (x - 180) / 14;
    const lower = 220 - (x - 182) * 5 / 128;
    const left = 180 + (y - 180) / 20;
    const right = 320 - (y - 170) * 10 / 45;
    if (y < upper || y > lower || x < left || x > right) continue;
    const offset = (y * PHOTO_WIDTH + x) * 3;
    const dark = x > 193 && x < 298 && x % 13 < 4 && y > 188 && y < 205;
    const rgb = dark ? [20, 20, 20] : color === "yellow" ? [240, 205, 20] : color === "green" ? [20, 150, 40] : [240, 240, 240];
    data[offset] = rgb[0] ?? 0; data[offset + 1] = rgb[1] ?? 0; data[offset + 2] = rgb[2] ?? 0;
  }
  return { channels: 3, data, height: PHOTO_HEIGHT, width: PHOTO_WIDTH };
}
