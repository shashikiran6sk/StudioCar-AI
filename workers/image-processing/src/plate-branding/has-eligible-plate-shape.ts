import type { RawImage } from "../execution/vehicle-alpha.types";
import {
  PLATE_WEAK_MODEL_SCORE_CEILING, PLATE_WEAK_MINIMUM_SURFACE_ASPECT,
  PLATE_WEAK_MINIMUM_SURFACE_FRAME_SHARE,
} from "./plate-branding.constants";
import type { PlateQuadrilateral } from "./plate-branding.types";
import { plateSurfaceAspect } from "./plate-surface-aspect";
import { polygonArea } from "./polygon-area";

/** Weak rankings need a substantial, elongated face rather than a label or distant plate. */
export function hasEligiblePlateShape(image: Pick<RawImage, "width" | "height">, corners: PlateQuadrilateral, score: number): boolean {
  if (score >= PLATE_WEAK_MODEL_SCORE_CEILING) return true;
  return plateSurfaceAspect(corners) >= PLATE_WEAK_MINIMUM_SURFACE_ASPECT &&
    polygonArea([corners.topLeft, corners.topRight, corners.bottomRight, corners.bottomLeft]) >=
      image.width * image.height * PLATE_WEAK_MINIMUM_SURFACE_FRAME_SHARE;
}
