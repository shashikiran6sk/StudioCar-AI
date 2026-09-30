import type { RawImage } from "./vehicle-alpha.types";

/** An RGBA layer positioned on the canvas, already clipped to it. */
export interface PlacedLayer {
  image: RawImage;
  left: number;
  top: number;
}
