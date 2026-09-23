import sharp from "sharp";

import { PROCESSING_STUDIO_ASSETS } from "../../../../../workers/image-processing/src/studio-scene/processing-studio-assets.constants";
import { TURNTABLE_LAYOUT } from "../../../../../workers/image-processing/src/studio-scene/studio-scene-geometry.constants";

/** A tenth of the real stage, drawn to the same geometry. */
const WIDTH = 384;
const HEIGHT = 216;
const FLOOR_TOP = Math.round(HEIGHT * 0.6);

export const FIXTURE_COLOURS = {
  wall: { r: 40, g: 40, b: 40 },
  floor: { r: 90, g: 90, b: 90 },
  /** Nothing else in a fixture scene is this green. */
  turntable: { r: 0, g: 200, b: 0 },
  vehicle: { r: 200, g: 20, b: 20 },
};

function hex(colour: { r: number; g: number; b: number }): string {
  return `rgb(${String(colour.r)},${String(colour.g)},${String(colour.b)})`;
}

async function floorLayer(withTurntable: boolean): Promise<Buffer> {
  const turntable = withTurntable
    ? `<ellipse cx="${String(TURNTABLE_LAYOUT.centerX * WIDTH)}" cy="${String(TURNTABLE_LAYOUT.centerY * HEIGHT)}" rx="${String(TURNTABLE_LAYOUT.radiusX * WIDTH)}" ry="${String(TURNTABLE_LAYOUT.radiusY * HEIGHT)}" fill="${hex(FIXTURE_COLOURS.turntable)}"/>`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${String(WIDTH)}" height="${String(HEIGHT)}"><rect y="${String(FLOOR_TOP)}" width="${String(WIDTH)}" height="${String(HEIGHT - FLOOR_TOP)}" fill="${hex(FIXTURE_COLOURS.floor)}"/>${turntable}</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** Every processing asset, stored under the worker's real object keys. */
export async function createStudioFixtures(): Promise<Map<string, Uint8Array>> {
  const wall = await sharp({
    create: { background: FIXTURE_COLOURS.wall, channels: 3, height: HEIGHT, width: WIDTH },
  })
    .webp({ lossless: true })
    .toBuffer();
  const standard = await floorLayer(false);
  const turntable = await floorLayer(true);
  const fixtures = new Map<string, Uint8Array>();
  for (const key of Object.values(PROCESSING_STUDIO_ASSETS.backgrounds)) {
    fixtures.set(key, wall);
  }
  for (const floor of Object.values(PROCESSING_STUDIO_ASSETS.floors)) {
    fixtures.set(floor.objectKey, floor.kind === "TURNTABLE" ? turntable : standard);
  }
  return fixtures;
}

/**
 * A transparent 600×400 cutout with a solid "vehicle" whose tyre line is at
 * y = 300, and a faint provider shadow beneath it that is not solid.
 */
export async function createVehicleCutout(): Promise<Buffer> {
  const body = await sharp({
    create: { background: { ...FIXTURE_COLOURS.vehicle, alpha: 1 }, channels: 4, height: 200, width: 400 },
  })
    .png()
    .toBuffer();
  const shadow = await sharp({
    create: { background: { r: 0, g: 0, b: 0, alpha: 0.5 }, channels: 4, height: 20, width: 380 },
  })
    .png()
    .toBuffer();
  return sharp({
    create: { background: { r: 0, g: 0, b: 0, alpha: 0 }, channels: 4, height: 400, width: 600 },
  })
    .composite([
      { input: body, left: 100, top: 100 },
      { input: shadow, left: 110, top: 300 },
    ])
    .png()
    .toBuffer();
}

/** How many pixels of an encoded image are close to `colour`. */
export async function countPixels(
  image: Uint8Array,
  colour: { r: number; g: number; b: number },
  tolerance = 24,
): Promise<number> {
  const { data, info } = await sharp(image)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let count = 0;
  for (let index = 0; index < info.width * info.height * 3; index += 3) {
    if (
      Math.abs((data[index] ?? 0) - colour.r) <= tolerance &&
      Math.abs((data[index + 1] ?? 0) - colour.g) <= tolerance &&
      Math.abs((data[index + 2] ?? 0) - colour.b) <= tolerance
    ) {
      count += 1;
    }
  }
  return count;
}
