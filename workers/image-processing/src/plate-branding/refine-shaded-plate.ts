import type { PlateDetection } from "@studiocar/contracts";

import type { RawImage } from "../execution/vehicle-alpha.types";
import {
  PLATE_CHANNEL_MAXIMUM, PLATE_OPAQUE_ALPHA, PLATE_SHADED_BRIGHT_QUANTILE,
  PLATE_SHADED_DARK_QUANTILE, PLATE_SHADED_MAXIMUM_BRIGHTNESS,
  PLATE_SHADED_MINIMUM_BRIGHTNESS, PLATE_SHADED_MINIMUM_CONTRAST,
  PLATE_SHADED_MINIMUM_MODEL_SCORE, PLATE_SHADED_MINIMUM_NEUTRAL_SHARE,
  PLATE_SHADED_MINIMUM_SURFACE_ASPECT, PLATE_SHADED_TARGET_BRIGHTNESS,
  PLATE_SURFACE_MARGIN, PLATE_SURFACE_SAMPLE_EDGE, PLATE_WHITE_MAXIMUM_CHANNEL_SPREAD,
} from "./plate-branding.constants";
import type { PlatePoint, PlateQuadrilateral, PlateSurfaceFitPass } from "./plate-branding.types";
import { isPlateSurfaceOpaque } from "./is-plate-surface-opaque";
import { plateSurfaceAspect } from "./plate-surface-aspect";
import { refinePlateQuadrilateral } from "./refine-plate-quadrilateral";

/** A bounded exposure fallback; never brighten an already bright or low-contrast patch. */
export function refineShadedPlate(image: RawImage, detection: PlateDetection, passes: readonly PlateSurfaceFitPass[]): PlateQuadrilateral | null {
  if (detection.score < PLATE_SHADED_MINIMUM_MODEL_SCORE) return null;
  const box = { left: detection.left * image.width, top: detection.top * image.height,
    width: detection.width * image.width, height: detection.height * image.height };
  const left = Math.max(0, Math.floor(box.left - box.width * PLATE_SURFACE_MARGIN));
  const top = Math.max(0, Math.floor(box.top - box.height * PLATE_SURFACE_MARGIN));
  const right = Math.min(image.width, Math.ceil(box.left + box.width * (1 + PLATE_SURFACE_MARGIN)));
  const bottom = Math.min(image.height, Math.ceil(box.top + box.height * (1 + PLATE_SURFACE_MARGIN)));
  const step = Math.max(1, Math.ceil(Math.max(right - left, bottom - top) / PLATE_SURFACE_SAMPLE_EDGE));
  const width = Math.ceil((right - left) / step);
  const height = Math.ceil((bottom - top) / step);
  const data = Buffer.alloc(width * height * image.channels);
  const values: number[] = [];
  let samples = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const px = left + x * step;
    const py = top + y * step;
    const source = (py * image.width + px) * image.channels;
    const destination = (y * width + x) * image.channels;
    image.data.copy(data, destination, source, source + image.channels);
    if (px < box.left || px >= box.left + box.width || py < box.top || py >= box.top + box.height) continue;
    samples++;
    if (image.channels === 4 && (data[destination + 3] ?? 0) < PLATE_OPAQUE_ALPHA) continue;
    const r = data[destination] ?? 0;
    const g = data[destination + 1] ?? 0;
    const b = data[destination + 2] ?? 0;
    const minimum = Math.min(r, g, b);
    if (Math.max(r, g, b) - minimum < PLATE_WHITE_MAXIMUM_CHANNEL_SPREAD) values.push(minimum);
  }
  if (values.length < samples * PLATE_SHADED_MINIMUM_NEUTRAL_SHARE || !values.length) return null;
  values.sort((a, b) => a - b);
  const bright = values[Math.floor((values.length - 1) * PLATE_SHADED_BRIGHT_QUANTILE)];
  const dark = values[Math.floor((values.length - 1) * PLATE_SHADED_DARK_QUANTILE)];
  if (bright === undefined || dark === undefined || bright < PLATE_SHADED_MINIMUM_BRIGHTNESS ||
      bright > PLATE_SHADED_MAXIMUM_BRIGHTNESS || bright - dark < PLATE_SHADED_MINIMUM_CONTRAST) return null;
  const gain = PLATE_SHADED_TARGET_BRIGHTNESS / bright;
  for (let offset = 0; offset < data.length; offset += image.channels) for (let channel = 0; channel < 3; channel++) {
    data[offset + channel] = Math.min(PLATE_CHANNEL_MAXIMUM, Math.round((data[offset + channel] ?? 0) * gain));
  }
  const local = refinePlateQuadrilateral({ channels: image.channels, data, width, height }, {
    ...detection, left: (box.left - left) / (step * width), top: (box.top - top) / (step * height),
    width: box.width / (step * width), height: box.height / (step * height),
  }, passes);
  if (!local || plateSurfaceAspect(local) < PLATE_SHADED_MINIMUM_SURFACE_ASPECT) return null;
  const restore = (point: PlatePoint): PlatePoint => ({ x: left + point.x * step, y: top + point.y * step });
  const corners = { topLeft: restore(local.topLeft), topRight: restore(local.topRight),
    bottomRight: restore(local.bottomRight), bottomLeft: restore(local.bottomLeft) };
  return isPlateSurfaceOpaque(image, corners) ? corners : null;
}
