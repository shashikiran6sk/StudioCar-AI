import type { StudioFloorKind } from "./studio-floor-kind";

/** The storage keys a studio treatment is composed from. */
export interface StudioSceneAssetKeys {
  backgroundKey: string;
  floorKey: string;
  floorKind: StudioFloorKind;
}

/** A studio treatment's layers, ready to compose. */
export interface StudioSceneAssets {
  background: Uint8Array;
  floor: Uint8Array;
  floorKind: StudioFloorKind;
}

/** A rectangle in pixels. */
export interface PixelBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Where the vehicle is in a cutout. `body` covers its solid pixels, so its
 * bottom is the tyre line; `extent` also covers soft edges and any shadow the
 * background-removal provider drew beneath it.
 */
export interface VehicleFootprint {
  body: PixelBox;
  extent: PixelBox;
}

export interface Ellipse {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/** How a scene is cut from the stage and where the vehicle stands in it. */
export interface StudioSceneLayout {
  /** The stage resized to output pixels. */
  stage: { width: number; height: number };
  /** The output frame's offset within the resized stage; negative extends it. */
  window: PixelBox;
  /** Output pixels per cutout pixel. */
  vehicleScale: number;
  /** Where the cutout's `extent` is drawn in the output frame. */
  vehicle: PixelBox | null;
  /** The soft contact shadow beneath the tyres, in output pixels. */
  contactShadow: Ellipse | null;
}
