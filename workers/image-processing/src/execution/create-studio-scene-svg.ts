import {
  HORIZON_ABOVE_CONTACT_RATIO,
  SHADOW_BLUR_RATIO,
  SHADOW_DEPTH_RATIO,
  SHADOW_RAISE_RATIO,
  SHADOW_WIDTH_RATIO,
  type StudioScenePalette,
} from "./studio-scene.constants";

/** Where the vehicle sits on the canvas, in pixels. */
export interface SubjectBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface StudioSceneInput {
  canvasWidth: number;
  canvasHeight: number;
  palette: StudioScenePalette;
  /** Contact-shadow opacity, or `null` for no shadow. */
  shadowOpacity: number | null;
  subject: SubjectBox;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

/**
 * The studio drawn behind a vehicle: a wall, a floor, and a soft shadow where
 * the tyres meet it.
 *
 * Everything is placed from the vehicle's own tyre line — the bottom of its
 * bounding box — so the car stands on the floor whatever the crop mode left
 * it, rather than floating above a fixed horizon.
 */
export function createStudioSceneSvg(input: StudioSceneInput): string {
  const { canvasWidth: width, canvasHeight: height, palette, subject } = input;
  const contact = subject.top + subject.height;
  const centreX = subject.left + subject.width / 2;

  const seam = clamp(
    Math.round(contact - subject.height * HORIZON_ABOVE_CONTACT_RATIO),
    0,
    height,
  );

  const shadow =
    input.shadowOpacity === null
      ? ""
      : `<ellipse cx="${String(centreX)}" cy="${String(Math.round(contact - subject.height * SHADOW_RAISE_RATIO))}" rx="${String(Math.round(subject.width * SHADOW_WIDTH_RATIO))}" ry="${String(Math.max(1, Math.round(subject.height * SHADOW_DEPTH_RATIO)))}" fill="#000" fill-opacity="${String(input.shadowOpacity)}" filter="url(#soft)"/>`;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${String(width)}" height="${String(height)}">`,
    "<defs>",
    `<linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${palette.wallTop}"/><stop offset="1" stop-color="${palette.wallBottom}"/></linearGradient>`,
    `<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${palette.floorTop}"/><stop offset="1" stop-color="${palette.floorBottom}"/></linearGradient>`,
    `<filter id="soft" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="${String(Math.max(1, Math.round(subject.height * SHADOW_BLUR_RATIO)))}"/></filter>`,
    "</defs>",
    `<rect width="${String(width)}" height="${String(seam)}" fill="url(#wall)"/>`,
    `<rect y="${String(seam)}" width="${String(width)}" height="${String(height - seam)}" fill="url(#floor)"/>`,
    shadow,
    "</svg>",
  ].join("");
}
