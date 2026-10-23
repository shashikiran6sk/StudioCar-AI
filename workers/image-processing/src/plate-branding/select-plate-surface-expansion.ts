import { createPlateProjection } from "./create-plate-projection";
import { PLATE_SURFACE_MAXIMUM_EXPANSION_RATIO, PLATE_SURFACE_NESTING_TOLERANCE } from "./plate-branding.constants";
import type { PlateQuadrilateral } from "./plate-branding.types";
import { polygonArea } from "./polygon-area";

/** Expand within the observed plate surface, never to an unrelated component. */
export function selectPlateSurfaceExpansion(current: PlateQuadrilateral | null, candidate: PlateQuadrilateral, detectorArea: number): PlateQuadrilateral {
  if (!current) return candidate;
  const previous = [current.topLeft, current.topRight, current.bottomRight, current.bottomLeft];
  const points = [candidate.topLeft, candidate.topRight, candidate.bottomRight, candidate.bottomLeft];
  const previousArea = polygonArea(previous);
  const candidateArea = polygonArea(points);
  if (candidateArea <= previousArea || candidateArea > detectorArea ||
      candidateArea > previousArea * PLATE_SURFACE_MAXIMUM_EXPANSION_RATIO) return current;
  const project = createPlateProjection(candidate);
  if (!project) return current;
  for (const point of previous) {
    const uv = project(point);
    if (!uv || uv.x < -PLATE_SURFACE_NESTING_TOLERANCE || uv.y < -PLATE_SURFACE_NESTING_TOLERANCE ||
        uv.x > 1 + PLATE_SURFACE_NESTING_TOLERANCE || uv.y > 1 + PLATE_SURFACE_NESTING_TOLERANCE) return current;
  }
  return candidate;
}
