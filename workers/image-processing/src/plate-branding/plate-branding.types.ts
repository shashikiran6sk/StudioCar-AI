import type { PlateDetection } from "@studiocar/contracts";

import type { RawImage } from "../execution/vehicle-alpha.types";

export interface PlatePoint { x: number; y: number }
export interface PlateSurfacePass {
  readonly minimumModelScore: number;
  readonly minimumChannel: number;
  readonly seedChannel: number;
}
export interface PlateSurfaceFitPass {
  readonly minimumCoverage: number;
  readonly minimumQuadFit: number;
  readonly requireTilt: boolean;
  readonly requireProjectedCoverage: boolean;
}
export interface PlateQuadrilateral {
  topLeft: PlatePoint;
  topRight: PlatePoint;
  bottomRight: PlatePoint;
  bottomLeft: PlatePoint;
}
export interface PlateOverlay {
  artwork: RawImage;
  corners: PlateQuadrilateral;
}
export interface PlateDetector {
  detect(image: RawImage): Promise<readonly PlateDetection[]>;
}
export interface PlateBrandingPort {
  /** Runs before composition, while image memory use is still low. */
  prepare(image: RawImage): Promise<PlateOverlay | null>;
}
