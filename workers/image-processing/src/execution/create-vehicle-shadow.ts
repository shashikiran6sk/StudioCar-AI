import sharp from "sharp";
import type { ShadowTreatment } from "@studiocar/contracts";
import type { VehicleAlpha } from "./vehicle-alpha.types";
import { projectContactMask } from "./project-contact-mask";
import {
  MAXIMUM_ALPHA,
  MINIMUM_SHADOW_BLUR,
  SHADOW_EDGE_FADE_BLUR_MULTIPLIER,
  VEHICLE_SHADOW_LAYERS,
} from "./vehicle-shadow.constants";

/** Layers are generated at the final vehicle scale, before the vehicle is composited. */
export async function createVehicleShadow(
  alpha: VehicleAlpha,
  treatment: ShadowTreatment,
): Promise<Buffer | null> {
  if (alpha.subject === null || treatment === "NONE") return null;
  const combined = new Uint8Array(alpha.width * alpha.height);
  for (const layer of VEHICLE_SHADOW_LAYERS[treatment]) {
    const blur = Math.max(
      MINIMUM_SHADOW_BLUR,
      alpha.subject.height * layer.blurRatio,
    );
    const projected = projectContactMask(alpha, layer);
    const softened = await sharp(projected, {
      raw: { width: alpha.width, height: alpha.height, channels: 1 },
    })
      .blur(blur)
      .extractChannel(0)
      .raw()
      .toBuffer();
    const edgeFade = Math.max(1, blur * SHADOW_EDGE_FADE_BLUR_MULTIPLIER);
    for (let y = 0; y < alpha.height; y += 1) {
      for (let x = 0; x < alpha.width; x += 1) {
        const index = y * alpha.width + x;
        // Fade before the canvas edge rather than abruptly clipping the blur.
        const fade = Math.min(
          1,
          x / edgeFade,
          (alpha.width - 1 - x) / edgeFade,
          y / edgeFade,
          (alpha.height - 1 - y) / edgeFade,
        );
        const opacity = (softened[index] ?? 0) * layer.opacity * fade;
        combined[index] = Math.round(
          MAXIMUM_ALPHA -
            (MAXIMUM_ALPHA - (combined[index] ?? 0)) *
              (1 - opacity / MAXIMUM_ALPHA),
        );
      }
    }
  }
  return sharp({
    create: {
      width: alpha.width,
      height: alpha.height,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .joinChannel(Buffer.from(combined), {
      raw: { width: alpha.width, height: alpha.height, channels: 1 },
    })
    .png()
    .toBuffer();
}
