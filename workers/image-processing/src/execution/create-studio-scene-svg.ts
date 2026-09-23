import type { FloorStyle } from "@studiocar/contracts";

import {
  HORIZON_ABOVE_CONTACT_RATIO,
  SHADOW_BLUR_RATIO,
  SHADOW_DEPTH_RATIO,
  SHADOW_RAISE_RATIO,
  SHADOW_WIDTH_RATIO,
  TURNTABLE_CENTRE_ABOVE_CONTACT_RATIO,
  TURNTABLE_DEPTH_RATIO,
  TURNTABLE_MAX_CANVAS_WIDTH_RATIO,
  TURNTABLE_SEAM_ABOVE_CONTACT_RATIO,
  TURNTABLE_SEAM_INSET_RATIO,
  TURNTABLE_WIDTH_RATIO,
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
  floor: FloorStyle;
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
    Math.round(
      contact -
        subject.height *
          (input.floor === "HORIZON"
            ? HORIZON_ABOVE_CONTACT_RATIO
            : TURNTABLE_SEAM_ABOVE_CONTACT_RATIO),
    ),
    0,
    height,
  );
  const floorTop =
    input.floor === "HORIZON" ? palette.floorTop : palette.surroundTop;
  const floorBottom =
    input.floor === "HORIZON" ? palette.floorBottom : palette.surroundBottom;

  const discRadiusX = Math.round(
    Math.min(
      subject.width * TURNTABLE_WIDTH_RATIO,
      width * TURNTABLE_MAX_CANVAS_WIDTH_RATIO,
    ),
  );
  const discRadiusY = Math.round(discRadiusX * TURNTABLE_DEPTH_RATIO);
  const discCentreY = Math.round(
    contact - subject.height * TURNTABLE_CENTRE_ABOVE_CONTACT_RATIO,
  );
  const turntable =
    input.floor === "TURNTABLE"
      ? `<ellipse cx="${String(centreX)}" cy="${String(discCentreY)}" rx="${String(discRadiusX)}" ry="${String(discRadiusY)}" fill="url(#disc)"/>` +
        `<ellipse cx="${String(centreX)}" cy="${String(discCentreY)}" rx="${String(discRadiusX)}" ry="${String(discRadiusY)}" fill="none" stroke="${palette.discRim}" stroke-width="3"/>` +
        `<ellipse cx="${String(centreX)}" cy="${String(discCentreY)}" rx="${String(Math.round(discRadiusX * TURNTABLE_SEAM_INSET_RATIO))}" ry="${String(Math.round(discRadiusY * TURNTABLE_SEAM_INSET_RATIO))}" fill="none" stroke="${palette.discSeam}" stroke-width="1.5"/>`
      : "";

  const shadow =
    input.shadowOpacity === null
      ? ""
      : `<ellipse cx="${String(centreX)}" cy="${String(Math.round(contact - subject.height * SHADOW_RAISE_RATIO))}" rx="${String(Math.round(subject.width * SHADOW_WIDTH_RATIO))}" ry="${String(Math.max(1, Math.round(subject.height * SHADOW_DEPTH_RATIO)))}" fill="#000" fill-opacity="${String(input.shadowOpacity)}" filter="url(#soft)"/>`;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${String(width)}" height="${String(height)}">`,
    "<defs>",
    `<linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${palette.wallTop}"/><stop offset="1" stop-color="${palette.wallBottom}"/></linearGradient>`,
    `<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${floorTop}"/><stop offset="1" stop-color="${floorBottom}"/></linearGradient>`,
    `<radialGradient id="disc" cx="0.5" cy="0.45" r="0.6"><stop offset="0" stop-color="${palette.discCentre}"/><stop offset="1" stop-color="${palette.discEdge}"/></radialGradient>`,
    `<filter id="soft" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="${String(Math.max(1, Math.round(subject.height * SHADOW_BLUR_RATIO)))}"/></filter>`,
    "</defs>",
    `<rect width="${String(width)}" height="${String(seam)}" fill="url(#wall)"/>`,
    `<rect y="${String(seam)}" width="${String(width)}" height="${String(height - seam)}" fill="url(#floor)"/>`,
    turntable,
    shadow,
    "</svg>",
  ].join("");
}
