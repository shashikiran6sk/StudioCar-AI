import type { PlateDetection } from "@studiocar/contracts";

import type { RawImage } from "../execution/vehicle-alpha.types";
import { convexHull } from "./convex-hull";
import {
  PLATE_OPAQUE_ALPHA, PLATE_SURFACE_MARGIN, PLATE_SURFACE_MINIMUM_COVERAGE,
  PLATE_SURFACE_MINIMUM_SOLIDITY, PLATE_SURFACE_SAMPLE_EDGE,
  PLATE_WHITE_MINIMUM_CHANNEL, PLATE_WHITE_MAXIMUM_CHANNEL_SPREAD,
  PLATE_WHITE_SURFACE_PASSES, PLATE_WHITE_SURFACE_THRESHOLD_STEP, PLATE_WHITE_MINIMUM_BRIGHT_SHARE,
  PLATE_YELLOW_MINIMUM_RED, PLATE_YELLOW_MINIMUM_GREEN, PLATE_YELLOW_MAXIMUM_BLUE_RATIO,
  PLATE_GREEN_MINIMUM_CHANNEL, PLATE_GREEN_RED_RATIO, PLATE_GREEN_BLUE_RATIO,
  PLATE_SURFACE_MAXIMUM_BOX_AREA_RATIO, PLATE_SURFACE_FIT_PASSES,
  PLATE_SURFACE_MINIMUM_EDGE_COVERAGE, PLATE_SURFACE_EDGE_TOLERANCE_PIXELS,
  PLATE_SURFACE_STRONG_MINIMUM_EDGE_COVERAGE, PLATE_STRONG_MODEL_SCORE,
  PLATE_SURFACE_MAXIMUM_CENTER_X_OFFSET, PLATE_SURFACE_MAXIMUM_CENTER_Y_OFFSET, PLATE_SURFACE_NEIGHBORS,
} from "./plate-branding.constants";
import type { PlatePoint, PlateQuadrilateral, PlateSurfaceFitPass } from "./plate-branding.types";
import { validatePlateQuadrilateral } from "./validate-plate-quadrilateral";
import { polygonArea } from "./polygon-area";
import { selectPlateSurfaceExpansion } from "./select-plate-surface-expansion";
import { isPlateSurfaceOpaque } from "./is-plate-surface-opaque";
import { hasTiltedPlateCoverage } from "./has-tilted-plate-coverage";
import { fitTiltedPlateOutline } from "./fit-tilted-plate-outline";
import { hasProjectedPlateCoverage } from "./has-projected-plate-coverage";

/**
 * Refine an ML box to the connected white/yellow/green physical plate surface.
 * Black plates and surfaces joined to the body are deliberately skipped.
 * Work is capped at a 320-pixel sampling edge, independent of source size.
 */
export function refinePlateQuadrilateral(image: RawImage, detection: PlateDetection, passes: readonly PlateSurfaceFitPass[] = PLATE_SURFACE_FIT_PASSES): PlateQuadrilateral | null {
  const box = { left: detection.left * image.width, top: detection.top * image.height,
    width: detection.width * image.width, height: detection.height * image.height };
  const left = Math.max(0, Math.floor(box.left - box.width * PLATE_SURFACE_MARGIN));
  const top = Math.max(0, Math.floor(box.top - box.height * PLATE_SURFACE_MARGIN));
  const right = Math.min(image.width, Math.ceil(box.left + box.width * (1 + PLATE_SURFACE_MARGIN)));
  const bottom = Math.min(image.height, Math.ceil(box.top + box.height * (1 + PLATE_SURFACE_MARGIN)));
  const step = Math.max(1, Math.ceil(Math.max(right - left, bottom - top) / PLATE_SURFACE_SAMPLE_EDGE));
  const width = Math.ceil((right - left) / step);
  const height = Math.ceil((bottom - top) / step);
  const strong = detection.score >= PLATE_STRONG_MODEL_SCORE;
  const minimumEdgeCoverage = strong ? PLATE_SURFACE_STRONG_MINIMUM_EDGE_COVERAGE : PLATE_SURFACE_MINIMUM_EDGE_COVERAGE;
  // Retain every successful standard fit before considering tilted coverage.
  for (const fit of passes) {
    let best: PlateQuadrilateral | null = null;
    // Retain a reliable bright-surface fit before attempting shadow growth.
    // A deeper-shadow pass requires a stronger model ranking as well as all
    // the same physical surface checks; model scores are not probabilities.
    for (const pass of PLATE_WHITE_SURFACE_PASSES) {
      if (detection.score < pass.minimumModelScore) continue;
      for (let minimumWhiteChannel = PLATE_WHITE_MINIMUM_CHANNEL;
        minimumWhiteChannel >= pass.minimumChannel;
        minimumWhiteChannel -= PLATE_WHITE_SURFACE_THRESHOLD_STEP) {
        const mask = new Uint8Array(width * height);
        const brightWhite = new Uint8Array(mask.length);
        for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
          const offset = ((top + y * step) * image.width + left + x * step) * image.channels;
          const r = image.data[offset] ?? 0;
          const g = image.data[offset + 1] ?? 0;
          const b = image.data[offset + 2] ?? 0;
          if (image.channels === 4 && (image.data[offset + 3] ?? 0) < PLATE_OPAQUE_ALPHA) continue;
          const white = Math.min(r, g, b) >= minimumWhiteChannel && Math.max(r, g, b) - Math.min(r, g, b) < PLATE_WHITE_MAXIMUM_CHANNEL_SPREAD;
          brightWhite[y * width + x] = white && Math.min(r, g, b) >= pass.seedChannel ? 1 : 0;
          const yellow = r >= PLATE_YELLOW_MINIMUM_RED && g >= PLATE_YELLOW_MINIMUM_GREEN && b < Math.min(r, g) * PLATE_YELLOW_MAXIMUM_BLUE_RATIO;
          const green = g >= PLATE_GREEN_MINIMUM_CHANNEL && g > r * PLATE_GREEN_RED_RATIO && g > b * PLATE_GREEN_BLUE_RATIO;
          mask[y * width + x] = white ? 1 : yellow ? 2 : green ? 3 : 0;
        }
        const quadrilaterals: PlateQuadrilateral[] = [];
        for (let seed = 0; seed < mask.length; seed++) {
          const color = mask[seed];
          if (!color) continue;
          const queue = [seed];
          mask[seed] = 0;
          const boundary: PlatePoint[] = [];
          let touchesEdge = false;
          let brightWhitePixels = 0;
          for (let cursor = 0; cursor < queue.length; cursor++) {
            const index = queue[cursor];
            if (index === undefined) continue;
            const x = index % width;
            const y = Math.floor(index / width);
            brightWhitePixels += brightWhite[index] ?? 0;
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
          // Grow through neutral shadows and antialiased letter edges, but require
          // a majority above the shadow seed threshold. A small highlight on a
          // dim gray surface cannot qualify the whole surface as a white plate.
          if (color === 1 && brightWhitePixels / queue.length < PLATE_WHITE_MINIMUM_BRIGHT_SHARE) continue;
          const hull = convexHull(boundary);
          const hullArea = polygonArea(hull);
          if (hullArea < box.width * box.height * fit.minimumCoverage ||
              hullArea > box.width * box.height * PLATE_SURFACE_MAXIMUM_BOX_AREA_RATIO ||
              queue.length * step ** 2 / hullArea < PLATE_SURFACE_MINIMUM_SOLIDITY) continue;
          const outlineHull = fit.requireTilt ? [...hull] : hull;
          // Remove the least significant hull corner until the four plate edges remain.
          while (hull.length > 4) {
            let minimum = Infinity;
            let remove = 0;
            for (let i = 0; i < hull.length; i++) {
              const a = hull[(i + hull.length - 1) % hull.length];
              const b = hull[i];
              const c = hull[(i + 1) % hull.length];
              if (!a || !b || !c) continue;
              const triangle = polygonArea([a, b, c]);
              if (triangle < minimum) { minimum = triangle; remove = i; }
            }
            hull.splice(remove, 1);
          }
          if (hull.length !== 4 || polygonArea(hull) < hullArea * fit.minimumQuadFit) continue;
          // A connected bright strip may be rectangular without covering the
          // whole registration surface. Small frames retain a pixel tolerance.
          const spanX = Math.max(...hull.map((point) => point.x)) - Math.min(...hull.map((point) => point.x));
          const spanY = Math.max(...hull.map((point) => point.y)) - Math.min(...hull.map((point) => point.y));
          if (spanX + PLATE_SURFACE_EDGE_TOLERANCE_PIXELS < box.width * minimumEdgeCoverage ||
              spanY + PLATE_SURFACE_EDGE_TOLERANCE_PIXELS < box.height * minimumEdgeCoverage) continue;
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
          let corners = { topLeft, topRight, bottomRight, bottomLeft };
          if (fit.requireTilt) {
            const outline = fitTiltedPlateOutline(outlineHull, corners, box.width, box.height);
            if (!outline) continue;
            const complete = fit.requireProjectedCoverage
              ? hasProjectedPlateCoverage(outline, box.width, box.height, hullArea)
              : hasTiltedPlateCoverage(outline, box.width, box.height);
            if (!complete) continue;
            corners = outline;
          }
          const points = [corners.topLeft, corners.topRight, corners.bottomRight, corners.bottomLeft];
          const centerX = points.reduce((sum, p) => sum + p.x, 0) / 4;
          const centerY = points.reduce((sum, p) => sum + p.y, 0) / 4;
          if (Math.abs(centerX - (box.left + box.width / 2)) > box.width * PLATE_SURFACE_MAXIMUM_CENTER_X_OFFSET ||
              Math.abs(centerY - (box.top + box.height / 2)) > box.height * PLATE_SURFACE_MAXIMUM_CENTER_Y_OFFSET) continue;
          if (validatePlateQuadrilateral(corners, image.width, image.height) && isPlateSurfaceOpaque(image, corners)) quadrilaterals.push(corners);
        }
        if (quadrilaterals.length > 1) return null;
        const candidate = quadrilaterals[0];
        if (!candidate) continue;
        if (!strong) return candidate;
        best = selectPlateSurfaceExpansion(best, candidate, box.width * box.height);
      }
    }
    if (best) return best;
  }
  return null;
}
