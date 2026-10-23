import type { RawImage } from "../../../../../workers/image-processing/src/execution/vehicle-alpha.types";
import type { PlateQuadrilateral } from "../../../../../workers/image-processing/src/plate-branding/plate-branding.types";

export const TILTED_BOX_WIDTH = 160;
export const TILTED_BOX_HEIGHT = 75;
const WIDTH = 500;
const HEIGHT = 300;
const LEFT = 175;
const RIGHT = 325;
const TOP = 132;
const BOTTOM = 175;
const RISE = 30;

/** A full slanted plate occupies less of its axis-aligned detector rectangle. */
export function createTiltedPlatePhoto(direction: "left" | "right", tilted = true) {
  const data = Buffer.alloc(WIDTH * HEIGHT * 3, 70);
  const rise = tilted ? RISE : 0;
  for (let x = LEFT; x <= RIGHT; x++) for (let y = TOP - rise; y <= BOTTOM; y++) {
    const shift = rise * (x - LEFT) / (RIGHT - LEFT);
    if (y < TOP - shift || y > BOTTOM - shift) continue;
    const px = direction === "right" ? x : WIDTH - 1 - x;
    const offset = (y * WIDTH + px) * 3;
    const glyph = x % 13 < 4 && y > TOP - shift + 10 && y < BOTTOM - shift - 10;
    data.fill(glyph ? 20 : 240, offset, offset + 3);
  }
  const image: RawImage = { data, channels: 3, width: WIDTH, height: HEIGHT };
  const corners: PlateQuadrilateral = direction === "right" ? {
    topLeft: { x: LEFT, y: TOP }, topRight: { x: RIGHT, y: TOP - rise },
    bottomRight: { x: RIGHT, y: BOTTOM - rise }, bottomLeft: { x: LEFT, y: BOTTOM },
  } : {
    topLeft: { x: WIDTH - 1 - RIGHT, y: TOP - rise }, topRight: { x: WIDTH - 1 - LEFT, y: TOP },
    bottomRight: { x: WIDTH - 1 - LEFT, y: BOTTOM }, bottomLeft: { x: WIDTH - 1 - RIGHT, y: BOTTOM - rise },
  };
  const detection = { left: (direction === "right" ? 170 : 169) / WIDTH, top: 100 / HEIGHT,
    width: TILTED_BOX_WIDTH / WIDTH, height: TILTED_BOX_HEIGHT / HEIGHT, score: 0.12 };
  return { image, corners, detection };
}
