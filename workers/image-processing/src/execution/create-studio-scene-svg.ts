import {
  HORIZON_ABOVE_CONTACT_RATIO,
  type StudioScenePalette,
} from "./studio-scene.constants";
import type { SubjectBox } from "./vehicle-alpha.types";

export interface StudioSceneInput {
  canvasWidth: number;
  canvasHeight: number;
  palette: StudioScenePalette;
  subject: SubjectBox;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

/**
 * The studio drawn behind a vehicle: a wall and a floor. Vehicle shadows are separate
 * raster layers generated from the final vehicle alpha.
 *
 * Everything is placed from the vehicle's own tyre line — the bottom of its
 * bounding box — so the car stands on the floor whatever the crop mode left
 * it, rather than floating above a fixed horizon.
 */
export function createStudioSceneSvg(input: StudioSceneInput): string {
  const { canvasWidth: width, canvasHeight: height, palette, subject } = input;
  const contact = subject.top + subject.height;

  const seam = clamp(
    Math.round(contact - subject.height * HORIZON_ABOVE_CONTACT_RATIO),
    0,
    height,
  );

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${String(width)}" height="${String(height)}">`,
    "<defs>",
    `<linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${palette.wallTop}"/><stop offset="1" stop-color="${palette.wallBottom}"/></linearGradient>`,
    `<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${palette.floorTop}"/><stop offset="1" stop-color="${palette.floorBottom}"/></linearGradient>`,
    "</defs>",
    `<rect width="${String(width)}" height="${String(seam)}" fill="url(#wall)"/>`,
    `<rect y="${String(seam)}" width="${String(width)}" height="${String(height - seam)}" fill="url(#floor)"/>`,
    "</svg>",
  ].join("");
}
