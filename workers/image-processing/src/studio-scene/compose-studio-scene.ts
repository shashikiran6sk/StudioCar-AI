import type { CropMode, ShadowTreatment } from "@studiocar/contracts";
import sharp, { type OverlayOptions } from "sharp";

import { createContactShadowSvg } from "./create-contact-shadow-svg";
import { cutSceneWindow } from "./cut-scene-window";
import { layoutStudioScene } from "./layout-studio-scene";
import { measureVehicleFootprint } from "./measure-vehicle-footprint";
import {
  CONTACT_SHADOW_OPACITY,
  INTERMEDIATE_PNG,
} from "./studio-compositing.constants";
import type {
  PixelBox,
  StudioSceneAssets,
  VehicleFootprint,
} from "./studio-scene.types";

export interface ComposeStudioSceneInput {
  crop: CropMode;
  /** A transparent cutout of the vehicle. */
  cutout: Uint8Array;
  enhancement: boolean;
  scene: StudioSceneAssets;
  shadow: ShadowTreatment;
}

async function vehicleOverlay(
  cutout: Uint8Array,
  footprint: VehicleFootprint,
  target: PixelBox,
  frame: { width: number; height: number },
  enhancement: boolean,
): Promise<OverlayOptions | null> {
  let vehicle = sharp(cutout)
    .ensureAlpha()
    .extract(footprint.extent)
    .resize(target.width, target.height, { fit: "fill" });
  if (enhancement) vehicle = vehicle.normalise().sharpen();
  const resized = await vehicle.png(INTERMEDIATE_PNG).toBuffer();

  // Only the part of the vehicle inside the frame is drawn.
  const left = Math.max(0, target.left);
  const top = Math.max(0, target.top);
  const right = Math.min(frame.width, target.left + target.width);
  const bottom = Math.min(frame.height, target.top + target.height);
  if (right <= left || bottom <= top) return null;
  const visible = await sharp(resized)
    .extract({
      left: left - target.left,
      top: top - target.top,
      width: right - left,
      height: bottom - top,
    })
    .png(INTERMEDIATE_PNG)
    .toBuffer();
  return { input: visible, left, top };
}

/**
 * Stands a vehicle cutout in a studio: the wall, then the floor or turntable,
 * then a soft contact shadow, then the vehicle itself. Every layer keeps its
 * transparency until the final flatten, so the turntable is drawn exactly as
 * stored and the vehicle stands on it rather than behind it.
 */
export async function composeStudioScene(
  input: ComposeStudioSceneInput,
): Promise<Buffer> {
  const metadata = await sharp(input.cutout).metadata();
  const footprint = await measureVehicleFootprint(input.cutout);
  const layout = layoutStudioScene({
    crop: input.crop,
    cutout: { width: metadata.width, height: metadata.height },
    floorKind: input.scene.floorKind,
    footprint,
  });
  const frame = { width: layout.window.width, height: layout.window.height };
  const [background, floor] = await Promise.all([
    cutSceneWindow(input.scene.background, layout),
    cutSceneWindow(input.scene.floor, layout),
  ]);

  const overlays: OverlayOptions[] = [
    { input: floor, left: 0, top: 0 },
  ];
  const shadowOpacity = CONTACT_SHADOW_OPACITY[input.shadow];
  if (layout.contactShadow && shadowOpacity !== null) {
    overlays.push({
      input: Buffer.from(
        createContactShadowSvg(frame, layout.contactShadow, shadowOpacity),
      ),
      left: 0,
      top: 0,
    });
  }
  if (footprint && layout.vehicle) {
    const vehicle = await vehicleOverlay(
      input.cutout,
      footprint,
      layout.vehicle,
      frame,
      input.enhancement,
    );
    if (vehicle) overlays.push(vehicle);
  }

  // Flattened separately: in one pipeline sharp flattens before compositing.
  const composed = await sharp(background)
    .composite(overlays)
    .png(INTERMEDIATE_PNG)
    .toBuffer();
  return sharp(composed).flatten().png(INTERMEDIATE_PNG).toBuffer();
}
