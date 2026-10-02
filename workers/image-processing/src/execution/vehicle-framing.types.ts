/**
 * How the provider's cutout frame sits on the output canvas: one uniform
 * scale and an offset, so a vehicle is never stretched. Offsets may be
 * negative; the canvas clips whatever falls outside it.
 */
export interface VehicleFraming {
  canvasHeight: number;
  canvasWidth: number;
  offsetX: number;
  offsetY: number;
  scale: number;
}
