import type { PlateDetection } from "@studiocar/contracts";

import type { RawImage } from "../execution/vehicle-alpha.types";
import { convexHull } from "./convex-hull";
import {
  PLATE_OPAQUE_ALPHA, PLATE_SURFACE_MARGIN, PLATE_SURFACE_MINIMUM_COVERAGE,
  PLATE_SURFACE_MINIMUM_SOLIDITY, PLATE_SURFACE_SAMPLE_EDGE,
  PLATE_WHITE_MINIMUM_CHANNEL, PLATE_WHITE_MAXIMUM_CHANNEL_SPREAD,
  PLATE_YELLOW_MINIMUM_RED, PLATE_YELLOW_MINIMUM_GREEN, PLATE_YELLOW_MAXIMUM_BLUE_RATIO,
  PLATE_GREEN_MINIMUM_CHANNEL, PLATE_GREEN_RED_RATIO, PLATE_GREEN_BLUE_RATIO,
  PLATE_SURFACE_MAXIMUM_BOX_AREA_RATIO, PLATE_SURFACE_MINIMUM_QUAD_FIT,
  PLATE_SURFACE_MAXIMUM_CENTER_X_OFFSET, PLATE_SURFACE_MAXIMUM_CENTER_Y_OFFSET, PLATE_SURFACE_NEIGHBORS,
} from "./plate-branding.constants";
import type { PlatePoint, PlateQuadrilateral } from "./plate-branding.types";
import { validatePlateQuadrilateral } from "./validate-plate-quadrilateral";

/**
 * Refine an ML box to the connected white/yellow/green physical plate surface.
 * Black plates and surfaces joined to the body are deliberately skipped.
 * Work is capped at a 320-pixel sampling edge, independent of source size.
 */
export function refinePlateQuadrilateral(image: RawImage, detection: PlateDetection): PlateQuadrilateral | null {
  const box = { left: detection.left * image.width, top: detection.top * image.height,
    width: detection.width * image.width, height: detection.height * image.height };
  const left = Math.max(0, Math.floor(box.left - box.width * PLATE_SURFACE_MARGIN));
  const top = Math.max(0, Math.floor(box.top - box.height * PLATE_SURFACE_MARGIN));
  const right = Math.min(image.width, Math.ceil(box.left + box.width * (1 + PLATE_SURFACE_MARGIN)));
  const bottom = Math.min(image.height, Math.ceil(box.top + box.height * (1 + PLATE_SURFACE_MARGIN)));
  const step = Math.max(1, Math.ceil(Math.max(right - left, bottom - top) / PLATE_SURFACE_SAMPLE_EDGE));
  const width = Math.ceil((right - left) / step);
  const height = Math.ceil((bottom - top) / step);
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const offset = ((top + y * step) * image.width + left + x * step) * image.channels;
    const r = image.data[offset] ?? 0;
    const g = image.data[offset + 1] ?? 0;
    const b = image.data[offset + 2] ?? 0;
    if (image.channels === 4 && (image.data[offset + 3] ?? 0) < PLATE_OPAQUE_ALPHA) continue;
    const white = Math.min(r, g, b) >= PLATE_WHITE_MINIMUM_CHANNEL && Math.max(r, g, b) - Math.min(r, g, b) < PLATE_WHITE_MAXIMUM_CHANNEL_SPREAD;
    const yellow = r >= PLATE_YELLOW_MINIMUM_RED && g >= PLATE_YELLOW_MINIMUM_GREEN && b < Math.min(r, g) * PLATE_YELLOW_MAXIMUM_BLUE_RATIO;
    const green = g >= PLATE_GREEN_MINIMUM_CHANNEL && g > r * PLATE_GREEN_RED_RATIO && g > b * PLATE_GREEN_BLUE_RATIO;
    mask[y * width + x] = white ? 1 : yellow ? 2 : green ? 3 : 0;
  }
  const area = (points: readonly PlatePoint[]): number => Math.abs(points.reduce((sum, p, i) => {
    const next = points[(i + 1) % points.length];
    return next ? sum + p.x * next.y - next.x * p.y : sum;
  }, 0)) / 2;
  const quadrilaterals: PlateQuadrilateral[] = [];
  for (let seed = 0; seed < mask.length; seed++) {
    const color = mask[seed];
    if (!color) continue;
    const queue = [seed];
    mask[seed] = 0;
    const boundary: PlatePoint[] = [];
    let touchesEdge = false;
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const index = queue[cursor];
      if (index === undefined) continue;
      const x = index % width;
      const y = Math.floor(index / width);
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) touchesEdge = true;
      let isBoundary = false;
      for (const [dx, dy] of PLATE_SURFACE_NEIGHBORS) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) { isBoundary = true; continue; }
        const neighbor = ny * width + nx;
        if (mask[neighbor] === color) { mask[neighbor] = 0; queue.push(neighbor); }
        else isBoundary = true;
      }
      if (isBoundary) boundary.push({ x: left + x * step, y: top + y * step });
    }
    if (touchesEdge || queue.length * step ** 2 < box.width * box.height * PLATE_SURFACE_MINIMUM_COVERAGE * PLATE_SURFACE_MINIMUM_SOLIDITY) continue;
    const hull = convexHull(boundary);
    const hullArea = area(hull);
    if (hullArea < box.width * box.height * PLATE_SURFACE_MINIMUM_COVERAGE ||
        hullArea > box.width * box.height * PLATE_SURFACE_MAXIMUM_BOX_AREA_RATIO ||
        queue.length * step ** 2 / hullArea < PLATE_SURFACE_MINIMUM_SOLIDITY) continue;
    // Remove the least significant hull corner until the four plate edges remain.
    while (hull.length > 4) {
      let minimum = Infinity;
      let remove = 0;
      for (let i = 0; i < hull.length; i++) {
        const a = hull[(i + hull.length - 1) % hull.length];
        const b = hull[i];
        const c = hull[(i + 1) % hull.length];
        if (!a || !b || !c) continue;
        const triangle = area([a, b, c]);
        if (triangle < minimum) { minimum = triangle; remove = i; }
      }
      hull.splice(remove, 1);
    }
    if (hull.length !== 4 || area(hull) < hullArea * PLATE_SURFACE_MINIMUM_QUAD_FIT) continue;
    // Hull winds clockwise in image coordinates. Start at the upper-left corner.
    const start = hull.reduce((best, p, i) => {
      const current = hull[best];
      return current && p.x / box.width + p.y / box.height < current.x / box.width + current.y / box.height ? i : best;
    }, 0);
    const topLeft = hull[start];
    const topRight = hull[(start + 1) % 4];
    const bottomRight = hull[(start + 2) % 4];
    const bottomLeft = hull[(start + 3) % 4];
    if (!topLeft || !topRight || !bottomRight || !bottomLeft) continue;
    const corners = { topLeft, topRight, bottomRight, bottomLeft };
    const centerX = hull.reduce((sum, p) => sum + p.x, 0) / 4;
    const centerY = hull.reduce((sum, p) => sum + p.y, 0) / 4;
    if (Math.abs(centerX - (box.left + box.width / 2)) > box.width * PLATE_SURFACE_MAXIMUM_CENTER_X_OFFSET ||
        Math.abs(centerY - (box.top + box.height / 2)) > box.height * PLATE_SURFACE_MAXIMUM_CENTER_Y_OFFSET) continue;
    if (validatePlateQuadrilateral(corners, image.width, image.height)) quadrilaterals.push(corners);
  }
  return quadrilaterals.length === 1 ? quadrilaterals[0] ?? null : null;
}
