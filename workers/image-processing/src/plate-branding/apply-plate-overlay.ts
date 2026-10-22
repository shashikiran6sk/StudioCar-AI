import type { RawImage } from "../execution/vehicle-alpha.types";
import type { VehicleFraming } from "../execution/vehicle-framing.types";
import { createPlateProjection } from "./create-plate-projection";
import type { PlateOverlay, PlatePoint } from "./plate-branding.types";
import { validatePlateQuadrilateral } from "./validate-plate-quadrilateral";
import { PLATE_ARTWORK_INNER_SHARE } from "./plate-branding.constants";

/** Changes only pixels inside the plate polygon. Neither input is mutated. */
export function applyPlateOverlay(image: RawImage, overlay: PlateOverlay | null, framing: VehicleFraming): RawImage {
  if (!overlay) return image;
  const transform = (point: PlatePoint): PlatePoint => ({
    x: point.x * framing.scale + framing.offsetX,
    y: point.y * framing.scale + framing.offsetY,
  });
  const corners = {
    topLeft: transform(overlay.corners.topLeft), topRight: transform(overlay.corners.topRight),
    bottomRight: transform(overlay.corners.bottomRight), bottomLeft: transform(overlay.corners.bottomLeft),
  };
  if (!validatePlateQuadrilateral(corners, image.width, image.height)) return image;
  const projection = createPlateProjection(corners);
  if (!projection) return image;
  const points = Object.values(corners);
  const left = Math.floor(Math.min(...points.map((p) => p.x)));
  const right = Math.ceil(Math.max(...points.map((p) => p.x)));
  const top = Math.floor(Math.min(...points.map((p) => p.y)));
  const bottom = Math.ceil(Math.max(...points.map((p) => p.y)));
  const { artwork } = overlay;
  if (artwork.channels !== 3 || !Number.isInteger(artwork.width) || !Number.isInteger(artwork.height) ||
      artwork.width < 1 || artwork.height < 1 || artwork.data.length !== artwork.width * artwork.height * 3) return image;
  const data = Buffer.from(image.data);
  const distance = (a: PlatePoint, b: PlatePoint): number => Math.hypot(a.x - b.x, a.y - b.y);
  const plateAspect = (distance(corners.topLeft, corners.topRight) + distance(corners.bottomLeft, corners.bottomRight)) /
    (distance(corners.topLeft, corners.bottomLeft) + distance(corners.topRight, corners.bottomRight));
  const artworkAspect = artwork.width / artwork.height;
  const fitWidth = Math.min(1, artworkAspect / plateAspect) * PLATE_ARTWORK_INNER_SHARE;
  const fitHeight = Math.min(1, plateAspect / artworkAspect) * PLATE_ARTWORK_INNER_SHARE;
  for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
    const uv = projection({ x: x + 0.5, y: y + 0.5 });
    if (!uv || uv.x < 0 || uv.y < 0 || uv.x > 1 || uv.y > 1) continue;
    const u = (uv.x - (1 - fitWidth) / 2) / fitWidth;
    const v = (uv.y - (1 - fitHeight) / 2) / fitHeight;
    const outputOffset = (y * image.width + x) * image.channels;
    if (u < 0 || u > 1 || v < 0 || v > 1) {
      data.fill(0, outputOffset, outputOffset + 3);
      continue;
    }
    const sx = u * (artwork.width - 1);
    const sy = v * (artwork.height - 1);
    const x0 = Math.floor(sx);
    const y0 = Math.floor(sy);
    const x1 = Math.min(x0 + 1, artwork.width - 1);
    const y1 = Math.min(y0 + 1, artwork.height - 1);
    const dx = sx - x0;
    const dy = sy - y0;
    for (let channel = 0; channel < 3; channel++) {
      const a = artwork.data[(y0 * artwork.width + x0) * 3 + channel] ?? 0;
      const b = artwork.data[(y0 * artwork.width + x1) * 3 + channel] ?? 0;
      const c = artwork.data[(y1 * artwork.width + x0) * 3 + channel] ?? 0;
      const d = artwork.data[(y1 * artwork.width + x1) * 3 + channel] ?? 0;
      data[(y * image.width + x) * image.channels + channel] = Math.round(
        a * (1 - dx) * (1 - dy) + b * dx * (1 - dy) + c * (1 - dx) * dy + d * dx * dy,
      );
    }
  }
  return { ...image, data };
}
