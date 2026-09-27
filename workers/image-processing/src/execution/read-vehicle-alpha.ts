import sharp from "sharp";
import { findAlphaBounds } from "./find-alpha-bounds";
import type { VehicleAlpha } from "./vehicle-alpha.types";

export async function readVehicleAlpha(cutout: Buffer): Promise<VehicleAlpha> {
  const { data, info } = await sharp(cutout)
    .ensureAlpha()
    .extractChannel("alpha")
    .raw()
    .toBuffer({ resolveWithObject: true });
  return {
    pixels: data,
    width: info.width,
    height: info.height,
    subject: findAlphaBounds(data, info.width, info.height),
  };
}
