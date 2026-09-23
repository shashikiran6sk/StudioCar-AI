import { CONTACT_SHADOW_BLUR_RATIO } from "./studio-compositing.constants";
import type { Ellipse } from "./studio-scene.types";

/**
 * The soft shadow where the tyres meet the floor, drawn over the whole frame
 * so it can be composited without an offset.
 */
export function createContactShadowSvg(
  frame: { width: number; height: number },
  shadow: Ellipse,
  opacity: number,
): string {
  const blur = Math.max(1, Math.round(shadow.rx * CONTACT_SHADOW_BLUR_RATIO * 4));
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${String(frame.width)}" height="${String(frame.height)}">`,
    `<defs><filter id="soft" x="-50%" y="-400%" width="200%" height="900%"><feGaussianBlur stdDeviation="${String(blur)}"/></filter></defs>`,
    `<ellipse cx="${String(Math.round(shadow.cx))}" cy="${String(Math.round(shadow.cy))}" rx="${String(Math.round(shadow.rx))}" ry="${String(Math.round(shadow.ry))}" fill="#000" fill-opacity="${String(opacity)}" filter="url(#soft)"/>`,
    "</svg>",
  ].join("");
}
